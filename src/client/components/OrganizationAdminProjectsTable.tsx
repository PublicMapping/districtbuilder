/** @jsx jsx */
import { useMemo, useEffect, useState } from "react";
import { useTable, Row, HeaderGroup, Cell, useSortBy, SortingRule, Column } from "react-table";
import { Link } from "react-router-dom";
import { Button, Flex, jsx, Themed, ThemeUIStyleObject } from "theme-ui";

import { ProjectVisibility } from "../../shared/constants";
import { OrganizationSlug, ProjectNest, IProjectTemplateWithProjects } from "../../shared/entities";

import { toggleProjectFeatured } from "../actions/organizationProjects";
import { formatDate } from "../functions";
import store from "../store";
import { isEqual } from "lodash";

export interface ProjectRow extends ProjectNest {
  readonly project: { readonly name: string; readonly id: string };
  readonly updatedAgo: string;
  readonly templateName: string;
  readonly submittedOn: string;
}

interface ProjectsTableProps {
  readonly templates?: readonly IProjectTemplateWithProjects[];
  readonly organizationSlug: OrganizationSlug;
}

const style: Record<string, ThemeUIStyleObject> = {
  main: { width: "100%", mx: 0, flexDirection: "column" },
  columnHeader: {
    borderBottom: "solid 3px red",
    background: "aliceblue",
    color: "black",
    fontWeight: "bold"
  },
  columnRow: { padding: "10px", border: "solid 1px gray" }
};

const OrganizationAdminProjectsTable = ({ templates, organizationSlug }: ProjectsTableProps) => {
  // eslint-disable-next-line
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  useEffect(() => {
    if (templates) {
      const resourceProjects = templates
        .map(pt => {
          return pt.projects.map(p => {
            return {
              ...p,
              project: { name: p.name, id: p.id },
              updatedAgo: formatDate(p.updatedDt),
              templateName: pt.name,
              submittedOn: p.submittedDt ? formatDate(p.submittedDt) : "-"
            };
          });
        })
        .flat();
      if (!isEqual(projects, resourceProjects)) {
        setProjects(resourceProjects);
      }
    }
  }, [projects, templates]);

  const sort = useMemo<SortingRule<ProjectRow>>(() => ({ id: "updatedDt", desc: true }), []);
  // eslint-disable-next-line
  let columns = useMemo<Array<Column<ProjectRow>>>(
    () => [
      {
        Header: "Map",
        accessor: "project" as const,
        Cell: (p: Cell<ProjectRow>) => {
          return (
            <Themed.a as={Link} to={`/projects/${p.value.id}`} target="_blank">
              {p.value.name}
            </Themed.a>
          );
        }
      },
      {
        Header: "Template",
        accessor: "templateName" as const
      },
      {
        Header: "Creator",
        accessor: row => row.user.name
      },
      {
        Header: "Creator email",
        accessor: row => row.user.email,
        Cell: (p: Cell<ProjectRow>) => {
          return <a href={`mailto:${p.value}`}>{p.value}</a>;
        }
      },
      {
        Header: "Updated on",
        accessor: "updatedDt" as const,
        Cell: (p: Cell<ProjectRow>) => {
          return p.row.original.updatedAgo;
        }
      },
      {
        Header: "Submitted on",
        accessor: "submittedOn" as const,
        Cell: (p: Cell<ProjectRow>) => {
          return p.row.original.submittedOn;
        }
      },
      {
        Header: "",
        accessor: "visibility" as const,
        disableSortBy: true,
        Cell: ({ row }: Cell<ProjectRow>) => {
          return row.original.visibility === ProjectVisibility.Published ? (
            <Button
              onClick={() =>
                store.dispatch(
                  toggleProjectFeatured({ project: row.original, organization: organizationSlug })
                )
              }
            >
              {row.original.isFeatured ? "Unfeature" : "Feature"}
            </Button>
          ) : (
            "Unpublished"
          );
        }
      }
    ],
    [organizationSlug]
  );
  // eslint-disable-next-line
  let data = useMemo(() => projects, [projects]);
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable<ProjectRow>(
    {
      columns,
      data,
      autoResetSortBy: false,
      initialState: {
        sortBy: [sort]
      }
    },
    useSortBy
  );

  // The 'key' is provided by react-table - note that if you try to add one there is a separate
  // error about duplicate props. It seems eslint can't figure it out.
  /* eslint-disable react/jsx-key */
  return (
    <Flex sx={{ flexDirection: "column" }}>
      <table {...getTableProps()} style={{ border: "solid 1px blue" }}>
        <thead>
          {headerGroups.map((headerGroup: HeaderGroup<ProjectRow>) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column: HeaderGroup<ProjectRow>) => (
                <th
                  {...column.getHeaderProps(column.getSortByToggleProps())}
                  sx={style.columnHeader}
                >
                  {column.render("Header")}
                  <span>{column.isSorted ? (column.isSortedDesc ? " 🔽" : " 🔼") : ""}</span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row: Row<ProjectRow>) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map((cell: Cell<ProjectRow>) => {
                  return (
                    <td
                      {...cell.getCellProps()}
                      style={{
                        padding: "10px",
                        border: "solid 1px gray"
                      }}
                    >
                      {cell.render("Cell")}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </Flex>
  );
  /* eslint-enable react/jsx-key */
};

export default OrganizationAdminProjectsTable;
