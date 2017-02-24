using System.Collections.Generic;

namespace QBuildServer.Models
{
    public class Database
    {
        public ICollection<Table> Tables { get; set; }

        public Database()
        {
           this.Tables = new HashSet<Table>();
        }
    }
}