import { supabase } from '@/integrations/supabase/client';

export interface BudgetSuggestion {
  icon: string;
  title: string;
  description: string;
  savings: number;
}

export interface BudgetSuggestionsRequest {
  destination: string;
  totalBudget: number;
  currentSpending: number;
  activities: {
    title: string;
    cost: number;
    category: string;
    day: number;
  }[];
}

export async function fetchBudgetSuggestions(request: BudgetSuggestionsRequest): Promise<BudgetSuggestion[]> {
  const { data, error } = await supabase.functions.invoke('budget-suggestions', {
    body: request,
  });

  if (error) {
    console.error('Error fetching budget suggestions:', error);
    throw new Error(error.message || 'Failed to fetch budget suggestions');
  }

  if (!data.success) {
    throw new Error(data.error || 'Failed to generate suggestions');
  }

  return data.suggestions;
}
