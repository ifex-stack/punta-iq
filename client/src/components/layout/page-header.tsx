import { FC, ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}

export const PageHeader: FC<PageHeaderProps> = ({
  title,
  description,
  icon,
  actions,
  children
}) => {
  return (
    <div className="flex flex-col gap-1 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <div className="flex items-center justify-center">{icon}</div>}
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>
        
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
      
      {description && (
        <p className="text-muted-foreground">{description}</p>
      )}
      
      {children}
    </div>
  );
};