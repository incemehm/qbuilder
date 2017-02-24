using Microsoft.SqlServer.Management.Common;
using Microsoft.SqlServer.Management.Smo;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace QBuildServer.Controllers
{
    public class DatabaseController : ApiController
    {
        public HttpResponseMessage Get(string db)
        {
            return Request.CreateResponse(HttpStatusCode.OK, InitializeServer(db));
           
        }

        Models.Database InitializeServer(string name)
        {
            SqlConnection sqlConnection = new SqlConnection(@"Data Source=(localdb)\MSSQLLocalDB;;Integrated Security=True");            
            ServerConnection serverConnection = new ServerConnection(sqlConnection);
            Server server = new Server(serverConnection);

            Models.Database db = new Models.Database();
            

            foreach (Table table in server.Databases[name].Tables)
            {
                Models.Table t = new Models.Table()
                {
                    Name = table.Name,
                    Alias = table.Name
                };

                foreach ( Column column in table.Columns)
                {
                    Models.Column c = new Models.Column()
                    {
                        Name = column.Name,
                        Alias = column.Name,
                        DataType = column.DataType.Name,
                        Size = column.DataType.MaximumLength
                    };
                    
                    t.Columns.Add(c);
                }
                
                foreach (ForeignKey fkey in table.ForeignKeys)
                {
                    t.References.Add(new Models.ForeignKey()
                    {
                        ColumnName = fkey.Columns[0].Name,
                        RefColumnName = fkey.Columns[0].ReferencedColumn,
                        RefTableName = fkey.ReferencedTable
                    });                   
                }
                
                db.Tables.Add(t);
            }

            return db;
            
        }
    }
}
