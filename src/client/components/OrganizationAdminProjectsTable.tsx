/** @jsx jsx */
import { useMemo } from "react";
import { useTable, Row, HeaderGroup, Cell, useSortBy } from "react-table";
import { Link } from "react-router-dom";
import { Button, Flex, jsx, Styled } from "theme-ui";

import { OrganizationSlug, ProjectNest } from "../../shared/entities";

import { toggleProjectFeatured } from "../actions/organizationProjects";
import store from "../store";
import { ProjectVisibility } from "../../shared/constants";

export interface ProjectRow extends ProjectNest {
  readonly project: { readonly name: string; readonly id: string };
  readonly updatedAgo: string;
  readonly templateName: string;
}

interface ProjectsTableProps {
  readonly projects: readonly ProjectRow[];
  readonly organizationSlug: OrganizationSlug;
}

const style = {
  main: { width: "100%", mx: 0, flexDirection: "column" },
  columnHeader: {
    borderBottom: "solid 3px red",
    background: "aliceblue",
    color: "black",
    fontWeight: "bold"
  },
  columnRow: { padding: "10px", border: "solid 1px gray" }
} as const;

const OrganizationAdminProjectsTable = ({ projects, organizationSlug }: ProjectsTableProps) => {
  const columns = useMemo(
    () => [
      {
        Header: "Map",
        accessor: "project", // accessor is the "key" in the data,
        Cell: (p: Cell<ProjectRow>) => {
          return (
            <Styled.a as={Link} to={`/projects/${p.value.id}`} target="_blank">
              {p.value.name}
            </Styled.a>
          );
        }
      },
      {
        Header: "Template",
        accessor: "templateName"
      },
      {
        Header: "Creator",
        accessor: "user.name"
      },
      {
        Header: "Creator email",
        accessor: "user.email",
        Cell: (p: Cell<ProjectRow>) => {
          return <a href={`mailto:${p.value}`}>{p.value}</a>;
        }
      },
      {
        Header: "Updated on",
        accessor: "updatedDt",
        Cell: (p: Cell<ProjectRow>) => {
          return p.row.original.updatedAgo;
        }
      }
    ],
    []
  );
  const data = useMemo(() => projects, [projects]);
  // ts-ignore needed below bc react-table requires mutable types, even though it doesn't mutate them?
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable<ProjectRow>(
    {
      // @ts-ignore
      columns,
      // @ts-ignore
      data
    },
    useSortBy
  );

  function projectFeaturedToggle(row: Row<ProjectRow>) {
    store.dispatch(
      toggleProjectFeatured({ project: row.original, organization: organizationSlug })
    );
  }

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
              <th sx={style.columnHeader}></th>
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
                <td sx={{ textAlign: "center" }}>
                  {row.original.visibility === ProjectVisibility.Published ? (
                    <Button onClick={() => projectFeaturedToggle(row)}>
                      {row.original.isFeatured ? "Unfeature" : "Feature"}
                    </Button>
                  ) : (
                    "Unpublished"
                  )}
                </td>
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
