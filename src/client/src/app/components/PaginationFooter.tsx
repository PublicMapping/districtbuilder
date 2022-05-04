/** @jsx jsx */
import React from "react";
import { jsx, Box, Button } from "theme-ui";
import "../App.css";
import { range } from "lodash";

interface StateProps {
  readonly currentPage: number;
  readonly totalPages: number;
  // eslint-disable-next-line
  readonly setPage: (number: number) => void;
}

const style = {
  pagination: {
    cursor: "pointer",
    display: "inline",
    mr: 1,
    backgroundColor: "transparent",
    color: "text"
  },
  paginationSelected: {
    cursor: "pointer",
    fontWeight: 700,
    display: "inline",
    mr: 1
  },
  pageList: {
    display: "inline-block",
    padding: 0,
    listStyle: "none"
  }
};

const MAX_PAGES_AROUND_CURRENT = 3;

const PaginationFooter = ({ currentPage, totalPages, setPage }: StateProps) => {
  // This component is to be used for server-side pagination with a list of elements rendered separately.

  // We show a set of pages around the current page, as well as links for first & last page
  const startingPage = Math.max(1, currentPage - MAX_PAGES_AROUND_CURRENT);
  const endingPage = Math.min(totalPages, currentPage + MAX_PAGES_AROUND_CURRENT);
  const pageNumbers = range(startingPage, endingPage);

  const PageLink = ({ number }: { readonly number: number }) => (
    <li sx={{ display: "inline" }} id={number.toString()}>
      <Button
        sx={number === currentPage ? style.paginationSelected : style.pagination}
        onClick={() => number !== currentPage && setPage(number)}
      >
        {number}
      </Button>
    </li>
  );

  return (
    <Box>
      {totalPages > 1 && (
        <ul id="page-numbers" sx={style.pageList}>
          {pageNumbers[0] === 1 || (
            <React.Fragment>
              <PageLink number={1} />
              {pageNumbers[0] > 2 && <span sx={{ px: 2, fontWeight: "800" }}>·</span>}
            </React.Fragment>
          )}
          {pageNumbers.map(number => (
            <PageLink number={number} key={number} />
          ))}
          {pageNumbers[pageNumbers.length - 1] === totalPages || (
            <React.Fragment>
              {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                <span sx={{ px: 2, fontWeight: "800" }}>·</span>
              )}
              <PageLink number={totalPages} />
            </React.Fragment>
          )}
        </ul>
      )}
    </Box>
  );
};

export default PaginationFooter;
