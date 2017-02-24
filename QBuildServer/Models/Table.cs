using System.Collections.Generic;

namespace QBuildServer.Models
{
    public class Table
    {
        public string Name { get; set; }
        public string Alias { get; set; }
        public ICollection<Column> Columns { get; set; }
        public ICollection<ForeignKey> References { get; set; }

        public Table()
        {
            this.Columns = new HashSet<Column>();
            this.References = new HashSet<ForeignKey>();
        }
    }
}