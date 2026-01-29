import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { MOCK_PROJECTS } from '@/data/mockData';
import { FolderKanban } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  budget: number;
  spent: number;
}

export function ProjectsOverview() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading with mock data
    const timer = setTimeout(() => {
      setProjects(MOCK_PROJECTS.slice(0, 4));
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-destructive';
    if (percentage >= 70) return 'bg-warning';
    return 'bg-success';
  };

  return (
    <Card className="shadow-card border-0">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <FolderKanban className="w-5 h-5 text-primary" />
          نظرة على المشاريع
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
                <div className="h-2 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FolderKanban className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>لا توجد مشاريع حتى الآن</p>
          </div>
        ) : (
          <div className="space-y-5">
            {projects.map((project) => {
              const percentage = project.budget > 0 ? Math.round((project.spent / project.budget) * 100) : 0;
              return (
                <div key={project.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{project.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(project.spent)} / {formatCurrency(project.budget)}
                    </span>
                  </div>
                  <div className="relative">
                    <Progress value={percentage} className="h-2" />
                    <div
                      className={`absolute top-0 right-0 h-2 rounded-full transition-all ${getProgressColor(percentage)}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{percentage}% مستخدم</span>
                    <span>متبقي: {formatCurrency(project.budget - project.spent)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
