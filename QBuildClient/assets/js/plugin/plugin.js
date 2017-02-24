(function ( $ ) {
 
    $.fn.greenify = function( options ) {
 
        var settings = $.extend({
            // These are the defaults.
            color: "#556b2f",
            backgroundColor: "white"
        }, options );
 
        return this.css({
            color: settings.color,
            backgroundColor: settings.backgroundColor
        });
    };
    $.fn.reverseText = function (params) {

        // merge default and user parameters
        params = $.extend({ minlength: 0, maxlength: 99999 }, params);

        // traverse all nodes
        this.each(function () {

            // express a single node as a jQuery object
            var $t = $(this);

            // find text
            var origText = $t.text(), newText = '';

            // text length within defined limits?
            if (origText.length >= params.minlength && origText.length <= params.maxlength) {

                // reverse text
                for (var i = origText.length - 1; i >= 0; i--) newText += origText.substr(i, 1);
                $t.text(newText);

            }

        });

        // allow jQuery chaining
        return this;
    };
    
    $.fn.qBuilder = function (options) {

        var settings = $.extend({
            url: "",
            columnContainer: "qBuild",
            resultContainer: "qResult",
            conditionContainer: "qCondition"
        }, options);

        var elem = this;
        
        $.get(settings.url, function (d) {
            var html = '';
            var columnSortable;
            var sortableTables = {};
            var data = d;

            d.Tables.forEach(function (table) {
                
                html += '<section id="s_' + table.Name + '"  class="section entity"><a>' + table.Name + '</a>' + '<span class="caret"></span>' +
                        '<ul id="' + table.Name + '" class="sortable list table-item">';

                table.Columns.forEach(function (column) {
                    html += '<li id="' + table.Name + '_' + column.Name + '">' + column.Name + '</li>';
                });

                html += '</ul></section>';
            });

            html = '<div style="float:left">' +
                            '<section class="section entities">' +
                                '<div id="qEntities">' +
                                 html +
                                '</div>' +
                            '</section>' +
                        '</div>' +
                        '<div style="float:left">' +
                            '<section class="section columns">' +
                                '<ul id="qBuild" class="connected sortable list"></ul>' +
                            '</section>' +
                            '<section class="section condition">' +
                                '<ul id="qCondition" class="connected sortable list"></ul>' +
                            '</section>' +
                        '</div>' +
                        '<div style="float:left">' +
                            '<section class="section result">' +
                                '<div id="qResult">Query</div>' +
                            '</section>' +
                        '</div>';

            elem.html(html);

            d.Tables.forEach(function (table) {

                $('#s_' + table.Name).click(function () {
                    $('#' + table.Name).toggle();
                });
                $('#' + table.Name).toggle();
               
                var sOptions = {
                    sort: false,
                    group: {
                        name: table.Name,
                        pull: 'clone'
                    },
                    onStart: function (evt) {
                        var queryColumns = columnSortable.toArray();
                        if(queryColumns.indexOf(evt.item.id) != -1)
                            columnSortable.option("disabled", true);
                        else
                            columnSortable.option("disabled", false);

                    },
                    onEnd: function (evt) {

                        columnSortable.option("disabled", false);

                    },
                    animation: 100
                };

                sortableTables[table.Name] = Sortable.create(document.getElementById(table.Name), sOptions);
            });
            
            columnSortable = Sortable.create(document.getElementById(settings.columnContainer), {
                sort: true,
                group: {
                    name: settings.columnContainer,
                    put: d.Tables.map(a => a.Name),
                    pull: false
                },
                animation: 100,
                dataIdAttr: 'id',
                onSort: function (evt) {
                    build(evt);
                },
                onAdd: function (evt) {

                    $(evt.item).append('<i id="i_cl_' + evt.item.id + '" class="column-button-delete"></i>');
                    $('#i_cl_' + evt.item.id).click(function () {
                        $(evt.item).remove();
                        build(evt);
                    });
                   
                    build(evt);
                }
            });

            conditionSortable = Sortable.create(document.getElementById(settings.conditionContainer), {
                sort: true,
                group: {
                    name: settings.conditionContainer,
                    put: d.Tables.map(a => a.Name),
                    pull: false
                },
                animation: 100,
                dataIdAttr: 'id',
                onSort: function (evt) {
                    build(evt);
                },
                onAdd: function (evt) {

                    $(evt.item).append('<i id="i_cn' + evt.item.id + '" class="column-button-delete"></i>');
                    $('#i_cn' + evt.item.id).click(function () {
                        $(evt.item).remove();
                        build(evt);
                    });

                    build(evt);
                }
            });

            function build(evt)
            {
                var query = buildQuery(evt) + buildWhere(evt);

                 $("#" + settings.resultContainer).html(query.replace(/(\r\n|\n|\r)/gm, "<br>"));
            }

            function buildQuery(evt) {
                var query = "";
                var table = data.Tables.filter(function (e) {
                    return e.Name === evt.from.id;
                })[0];
                var t = table.Name;

                var refTablesOfTable = data.Tables.filter(function (e) {
                    return table.References.filter(function (r) {
                        return r.RefTableName === e.Name;
                    }).length > 0;
                });

                var refTablesToTable = data.Tables.filter(function (e) {
                    return e.References.filter(function (r) {
                        return r.RefTableName === table.Name;
                    }).length > 0;
                });

                var queryColumns = columnSortable.toArray().map(c => c.replace(c.substr(0, c.indexOf("_") + 1), "[" + c.substr(0, c.indexOf("_")) + "]."));
                var queryTables = queryColumns.map(a => a.substr(0, a.indexOf(".")).replace("[","").replace("]","")).filter(function (e, i, s) { return i == s.indexOf(e); });
                var queryTablesWithAlias = queryTables.map(a => a + " AS " + a);

                query += "SELECT ";
                query += queryColumns.join();
                query += " FROM [" + t + "]\r\n";

                
                if (table.References.length > 0) {
                    for(var reference of table.References)
                    {
                        if (queryTables.indexOf(reference.RefTableName) != -1)
                        {
                            query += " INNER JOIN [" + reference.RefTableName + "] ON ";
                            query += "[" + t + "]" + "." + reference.ColumnName + " = [" + reference.RefTableName + "]." + reference.RefColumnName + "\r\n";
                        }
                    }
                }

                if (refTablesToTable.length > 0) {
                    for(var refTable of refTablesToTable)
                    {
                        if (queryTables.indexOf(refTable.Name) != -1)
                        {
                            var reference = refTable.References.filter(function (r) {
                                return r.RefTableName === t;
                            })[0];

                            query += " INNER JOIN [" + refTable.Name + "] ON ";
                            query += "[" + t + "]" + "." + reference.RefColumnName + " = [" + refTable.Name + "]." + reference.ColumnName + "\r\n";
                        }
                    }
                }

               return query.replace(/(\r\n|\n|\r)/gm, "<br>");
            }

            function buildWhere(evt)
            {
                var query = "";

                var queryColumns = conditionSortable.toArray().map(c => c.replace(c.substr(0, c.indexOf("_") + 1), "[" + c.substr(0, c.indexOf("_")) + "]."));
                var conditions = queryColumns.map(qc => qc + " = '%'");

                query += " WHERE ";
                query += conditions.join(" AND ");


                return query.replace(/(\r\n|\n|\r)/gm, "<br>");
            }
            
        }, "json");
    };
	

	var JunctionTypeEnum = {
	   
	    "AND": "AND",
	    "OR": "OR",
	    "ANY": "ANY",
	    "ALL": "ALL"
	};

	var ConditionOperatorEnum = {
	    "IsNull": "IsNull",
	    "IsNotNull": "IsNotNull",
	    "Equal": "Equal",
	    "NotEqual": "NotEqual",
	    "Less": "Less",
	    "NotLess": "NotLess",
	    "LessEqual": "LessEqual",
	    "NotLessEqual": "NotLessEqual",
	    "Greater": "Greater",
	    "NotGreater": "NotGreater",
	    "GreaterEqual": "GreaterEqual",
	    "NotGreaterEqual": "NotGreaterEqual",
	    "Between": "Between",
	    "NotBetween": "NotBetween",
	    "In": "In",
	    "NotIn": "NotIn",
	    "Contains": "Contains",
	    "DoesntContain": "DoesntContain",
	    "StartsWith": "StartsWith",
	    "DoesntStartWith": "DoesntStartWith",
	    "EndsWith": "EndsWith",
	    "DoesntEndWith": "DoesntEndWith"
	};




 
}( jQuery ));