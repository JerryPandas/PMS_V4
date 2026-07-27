namespace PmsApi.Domain.Enums;

public static class ProjectStatus
{
    public const string Active = "Active";
    public const string OnHold = "OnHold";
    public const string Completed = "Completed";
}

public static class ItemStatus
{
    public const string Todo = "Todo";
    public const string InProgress = "InProgress";
    public const string Done = "Done";
}

public static class KanbanColumn
{
    public const string Todo = "Todo";
    public const string InProgress = "InProgress";
    public const string Review = "Review";
    public const string Done = "Done";
}

public static class PriorityLevel
{
    public const string Low = "Low";
    public const string Normal = "Normal";
    public const string High = "High";
}

public static class ChangeType
{
    public const string DateChanged = "DateChanged";
    public const string AssigneeChanged = "AssigneeChanged";
}
