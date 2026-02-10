import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Minus, Gem } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface Traveler {
  age: number;
  gender: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';
}

export interface TravelerData {
  total: number;
  travelers: Traveler[];
  hiddenGems: boolean;
}

interface TravelerDetailsStepProps {
  data: TravelerData;
  onChange: (data: TravelerData) => void;
}

const TravelerDetailsStep = ({ data, onChange }: TravelerDetailsStepProps) => {
  const updateTotal = (newTotal: number) => {
    const clamped = Math.max(1, Math.min(10, newTotal));
    const travelers = [...data.travelers];
    
    // Add new travelers if needed
    while (travelers.length < clamped) {
      travelers.push({ age: 25, gender: 'prefer-not-to-say' });
    }
    // Remove extras
    travelers.length = clamped;
    
    onChange({ ...data, total: clamped, travelers });
  };

  const updateTraveler = (index: number, field: keyof Traveler, value: string | number) => {
    const travelers = [...data.travelers];
    travelers[index] = { ...travelers[index], [field]: value };
    onChange({ ...data, travelers });
  };

  return (
    <motion.div
      key="travelers"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-xl space-y-8"
    >
      <div className="text-center space-y-3">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="w-16 h-16 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center"
        >
          <Users className="w-8 h-8 text-primary" />
        </motion.div>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground font-display">
          Who's traveling? 👥
        </h2>
        <p className="text-muted-foreground">
          Tell us about your group so we can tailor recommendations.
        </p>
      </div>

      {/* Number of Travelers */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => updateTotal(data.total - 1)}
          disabled={data.total <= 1}
          className="rounded-full w-10 h-10 min-h-[44px] min-w-[44px]"
        >
          <Minus className="w-4 h-4" />
        </Button>
        <div className="text-center">
          <div className="text-3xl font-bold font-mono text-foreground">{data.total}</div>
          <div className="text-xs text-muted-foreground">
            {data.total === 1 ? 'Traveler' : 'Travelers'}
          </div>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => updateTotal(data.total + 1)}
          disabled={data.total >= 10}
          className="rounded-full w-10 h-10 min-h-[44px] min-w-[44px]"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Traveler Details */}
      <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1 scrollbar-hide">
        {data.travelers.map((traveler, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/50"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground min-w-[90px]">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                {index + 1}
              </div>
              Traveler {index + 1}
            </div>
            
            <div className="flex gap-3 flex-1">
              <div className="flex-1">
                <Input
                  type="number"
                  min={1}
                  max={120}
                  placeholder="Age"
                  value={traveler.age || ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    updateTraveler(index, 'age', Number.isFinite(val) ? Math.min(120, Math.max(1, val)) : 0);
                  }}
                  className="h-10 bg-background/50 border-border/50 rounded-lg text-sm font-mono"
                />
              </div>
              
              <div className="flex-1">
                <Select
                  value={traveler.gender}
                  onValueChange={(val) => updateTraveler(index, 'gender', val)}
                >
                  <SelectTrigger className="h-10 bg-background/50 border-border/50 rounded-lg text-sm">
                    <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border z-[100]">
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="non-binary">Non-binary</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Hidden Gems Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={cn(
          "flex items-center justify-between p-4 rounded-xl border transition-all duration-200",
          data.hiddenGems
            ? "bg-primary/10 border-primary/30"
            : "bg-card/50 border-border/50"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
            data.hiddenGems ? "bg-primary/20" : "bg-muted"
          )}>
            <Gem className={cn(
              "w-5 h-5 transition-colors",
              data.hiddenGems ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          <div>
            <Label htmlFor="hidden-gems" className="text-sm font-semibold text-foreground cursor-pointer">
              Find Hidden Gems (Non-Touristy)
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Discover local secrets & underrated spots
            </p>
          </div>
        </div>
        <Switch
          id="hidden-gems"
          checked={data.hiddenGems}
          onCheckedChange={(checked) => onChange({ ...data, hiddenGems: checked })}
        />
      </motion.div>
    </motion.div>
  );
};

export default TravelerDetailsStep;
