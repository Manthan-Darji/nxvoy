import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, TrendingUp, AlertTriangle, CheckCircle2, 
  Lightbulb, ChevronDown, ChevronUp, Loader2,
  UtensilsCrossed, Camera, Bus, Ticket, ShoppingBag, Bed
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Activity } from './ActivityCard';
import { fetchBudgetSuggestions, BudgetSuggestion } from '@/services/budgetService';
import { useToast } from '@/hooks/use-toast';

interface DayData {
  day: number;
  activities: Activity[];
}

interface BudgetDashboardProps {
  days: DayData[];
  totalBudget: number;
  destination: string;
  currency?: string;
}

const categoryConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  food: { icon: UtensilsCrossed, color: '#F97316', label: 'Food' },
  meal: { icon: UtensilsCrossed, color: '#F97316', label: 'Food' },
  attraction: { icon: Camera, color: '#3B82F6', label: 'Attractions' },
  sightseeing: { icon: Camera, color: '#3B82F6', label: 'Attractions' },
  transport: { icon: Bus, color: '#10B981', label: 'Transport' },
  activity: { icon: Ticket, color: '#8B5CF6', label: 'Activities' },
  adventure: { icon: Ticket, color: '#8B5CF6', label: 'Activities' },
  culture: { icon: Ticket, color: '#8B5CF6', label: 'Activities' },
  shopping: { icon: ShoppingBag, color: '#EC4899', label: 'Shopping' },
  accommodation: { icon: Bed, color: '#6366F1', label: 'Stay' },
  stay: { icon: Bed, color: '#6366F1', label: 'Stay' },
  other: { icon: Wallet, color: '#6B7280', label: 'Other' },
};

const BudgetDashboard = ({ days, totalBudget, destination, currency = '₹' }: BudgetDashboardProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<BudgetSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const { toast } = useToast();

  // Calculate all budget metrics
  const budgetMetrics = useMemo(() => {
    const allActivities = days.flatMap(d => d.activities);
    const totalSpent = allActivities.reduce((sum, a) => sum + (a.estimatedCost || 0), 0);
    
    // Category breakdown
    const categoryTotals: Record<string, number> = {};
    allActivities.forEach(activity => {
      const cat = activity.category?.toLowerCase() || 'other';
      const normalizedCat = categoryConfig[cat] ? cat : 'other';
      categoryTotals[normalizedCat] = (categoryTotals[normalizedCat] || 0) + (activity.estimatedCost || 0);
    });

    // Consolidate similar categories
    const consolidatedTotals: Record<string, number> = {};
    Object.entries(categoryTotals).forEach(([cat, amount]) => {
      const label = categoryConfig[cat]?.label || 'Other';
      consolidatedTotals[label] = (consolidatedTotals[label] || 0) + amount;
    });

    const pieData = Object.entries(consolidatedTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Daily spending
    const dailySpending = days.map(day => {
      const spent = day.activities.reduce((sum, a) => sum + (a.estimatedCost || 0), 0);
      return { day: day.day, spent };
    });

    const avgDailySpend = dailySpending.length > 0 
      ? totalSpent / dailySpending.length 
      : 0;

    // Prediction
    const predictedTotal = days.length > 0 
      ? avgDailySpend * days.length
      : totalSpent;

    const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    const predictedPercentage = totalBudget > 0 ? (predictedTotal / totalBudget) * 100 : 0;

    return {
      totalSpent,
      remaining: totalBudget - totalSpent,
      percentage,
      predictedTotal,
      predictedPercentage,
      pieData,
      dailySpending,
      avgDailySpend,
      isOverBudget: totalSpent > totalBudget,
      willExceedBudget: predictedTotal > totalBudget,
    };
  }, [days, totalBudget]);

  const getProgressColor = (percentage: number) => {
    if (percentage <= 70) return 'bg-green-500';
    if (percentage <= 90) return 'bg-yellow-500';
    if (percentage <= 110) return 'bg-red-500';
    return 'bg-red-700';
  };

  const getStatusBadge = (percentage: number) => {
    if (percentage <= 70) return { label: 'On Track', variant: 'default' as const, className: 'bg-green-500' };
    if (percentage <= 90) return { label: 'Watch Budget', variant: 'secondary' as const, className: 'bg-yellow-500 text-yellow-950' };
    if (percentage <= 110) return { label: 'Near Limit', variant: 'destructive' as const, className: 'bg-red-500' };
    return { label: 'Over Budget!', variant: 'destructive' as const, className: 'bg-red-700' };
  };

  const status = getStatusBadge(budgetMetrics.percentage);

  const COLORS = ['#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#6366F1', '#6B7280'];

  const loadSuggestions = async () => {
    if (suggestions.length > 0) {
      setShowSuggestions(!showSuggestions);
      return;
    }

    setIsLoadingSuggestions(true);
    setShowSuggestions(true);
    
    try {
      const activities = days.flatMap(d => d.activities.map(a => ({
        title: a.title,
        cost: a.estimatedCost || 0,
        category: a.category || 'other',
        day: d.day,
      })));

      const result = await fetchBudgetSuggestions({
        destination,
        totalBudget,
        currentSpending: budgetMetrics.totalSpent,
        activities,
      });
      
      setSuggestions(result);
    } catch (error) {
      toast({
        title: 'Could not load suggestions',
        description: 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const getDayStatus = (spent: number) => {
    const avgDaily = totalBudget / Math.max(days.length, 1);
    const ratio = spent / avgDaily;
    
    if (ratio <= 1) return { icon: CheckCircle2, color: 'text-green-500', label: 'Under budget' };
    if (ratio <= 1.5) return { icon: AlertTriangle, color: 'text-yellow-500', label: 'High spending' };
    return { icon: AlertTriangle, color: 'text-red-500', label: 'Over daily limit' };
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Main Budget Card */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wallet className="w-5 h-5 text-primary" />
              Budget Tracker
            </CardTitle>
            <Badge className={status.className}>{status.label}</Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Progress Section */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-bold text-foreground">
                  {currency}{budgetMetrics.totalSpent.toLocaleString()}
                </span>
                <span className="text-muted-foreground ml-1">
                  / {currency}{totalBudget.toLocaleString()}
                </span>
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                {budgetMetrics.percentage.toFixed(0)}%
              </span>
            </div>
            
            <div className="relative h-3 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${getProgressColor(budgetMetrics.percentage)} rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(budgetMetrics.percentage, 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
              {budgetMetrics.percentage > 100 && (
                <motion.div
                  className="absolute top-0 right-0 h-full bg-red-700/50 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(budgetMetrics.percentage - 100, 20)}%` }}
                  transition={{ duration: 0.5, delay: 1 }}
                />
              )}
            </div>

            {/* Remaining / Over */}
            <div className="flex justify-between text-sm">
              {budgetMetrics.remaining >= 0 ? (
                <span className="text-green-600 dark:text-green-400">
                  {currency}{budgetMetrics.remaining.toLocaleString()} remaining
                </span>
              ) : (
                <span className="text-red-600 dark:text-red-400 font-medium">
                  {currency}{Math.abs(budgetMetrics.remaining).toLocaleString()} over budget!
                </span>
              )}
              <span className="text-muted-foreground">
                Avg: {currency}{budgetMetrics.avgDailySpend.toFixed(0)}/day
              </span>
            </div>
          </div>

          {/* Prediction Alert */}
          {budgetMetrics.willExceedBudget && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3"
            >
              <div className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-200">
                    Projected spending: {currency}{budgetMetrics.predictedTotal.toFixed(0)}
                  </p>
                  <p className="text-amber-700 dark:text-amber-300">
                    {currency}{(budgetMetrics.predictedTotal - totalBudget).toFixed(0)} over your budget at current rate
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Category Breakdown */}
          {budgetMetrics.pieData.length > 0 && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={budgetMetrics.pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={50}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {budgetMetrics.pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${currency}${value.toLocaleString()}`, '']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex flex-col justify-center space-y-1.5">
                {budgetMetrics.pieData.slice(0, 4).map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2 text-xs">
                    <div 
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-muted-foreground flex-1 truncate">{item.name}</span>
                    <span className="font-medium text-foreground">
                      {currency}{item.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Daily Spending</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {budgetMetrics.dailySpending.map(({ day, spent }) => {
            const dayStatus = getDayStatus(spent);
            const StatusIcon = dayStatus.icon;
            const dailyBudget = totalBudget / Math.max(days.length, 1);
            const dayPercentage = (spent / dailyBudget) * 100;
            
            return (
              <div key={day} className="flex items-center gap-3">
                <span className="text-sm font-medium w-14 text-muted-foreground">Day {day}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      dayPercentage <= 100 ? 'bg-green-500' : 
                      dayPercentage <= 150 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(dayPercentage, 100)}%` }}
                    transition={{ duration: 0.5, delay: day * 0.1 }}
                  />
                </div>
                <span className="text-sm font-medium w-20 text-right">{currency}{spent.toLocaleString()}</span>
                <StatusIcon className={`w-4 h-4 ${dayStatus.color} flex-shrink-0`} />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* AI Suggestions */}
      {budgetMetrics.percentage > 70 && (
        <Card className="border-violet-200 dark:border-violet-800">
          <CardContent className="pt-4">
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto hover:bg-transparent"
              onClick={loadSuggestions}
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-violet-100 dark:bg-violet-900/30">
                  <Lightbulb className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
                <span className="font-medium text-foreground">💡 AI Budget Tips</span>
              </div>
              {isLoadingSuggestions ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : showSuggestions ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </Button>

            <AnimatePresence>
              {showSuggestions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 space-y-3">
                    {isLoadingSuggestions ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-violet-500 mr-2" />
                        <span className="text-sm text-muted-foreground">Analyzing your itinerary...</span>
                      </div>
                    ) : suggestions.length > 0 ? (
                      suggestions.map((suggestion, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-3 border border-violet-100 dark:border-violet-800"
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-lg">{suggestion.icon}</span>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground">{suggestion.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{suggestion.description}</p>
                              {suggestion.savings > 0 && (
                                <Badge variant="outline" className="mt-2 text-green-600 border-green-300">
                                  Save {currency}{suggestion.savings.toLocaleString()}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        No suggestions available right now
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BudgetDashboard;
