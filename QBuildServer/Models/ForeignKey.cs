namespace QBuildServer.Models
{
    public class ForeignKey
    {
        public string ColumnName { get; set; }
        public string RefColumnName { get; set; }
        public string RefTableName { get; set; }
    }
}