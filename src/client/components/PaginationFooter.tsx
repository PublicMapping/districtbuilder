/** @jsx jsx */
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

const PaginationFooter = ({ currentPage, totalPages, setPage }: StateProps) => {
  // This component is to be used for server-side pagination with a list of elements rendered separately.

  const pageNumbers = range(1, totalPages + 1);

  const renderPageNumbers =
    pageNumbers &&
    pageNumbers.map(number => {
      return (
        <li sx={{ display: "inline" }} key={number} id={number.toString()}>
          <Button
            sx={number === currentPage ? style.paginationSelected : style.pagination}
            onClick={() => number !== currentPage && setPage(number)}
          >
            {number}
          </Button>
        </li>
      );
    });

  return (
    <Box>
      {totalPages > 1 && (
        <ul id="page-numbers" sx={style.pageList}>
          {renderPageNumbers}
        </ul>
      )}
    </Box>
  );
};

export default PaginationFooter;
