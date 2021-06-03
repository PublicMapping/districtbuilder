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
    // TODO: Make this not look bad
    cursor: "pointer",
    display: "inline",
    mr: 1
  },
  paginationSelected: {
    // TODO: Make this not look bad
    cursor: "pointer",
    fontWeight: 700,
    display: "inline"
  },
  pageList: {
    display: "inline-block"
  }
};

const PaginationFooter = ({ currentPage, totalPages, setPage }: StateProps) => {
  // This component is to be used for server-side pagination with a list of elements rendered separately.

  const pageNumbers = range(1, totalPages + 1);

  const renderPageNumbers =
    pageNumbers &&
    pageNumbers.map(number => {
      return (
        <li
          key={number}
          id={number.toString()}
          sx={number === currentPage ? style.paginationSelected : style.pagination}
        >
          <Button disabled={number === currentPage} onClick={() => setPage(number)}>
            {number}
          </Button>
        </li>
      );
    });

  return (
    <Box>
      {
        <ul id="page-numbers" sx={style.pageList}>
          {renderPageNumbers}
        </ul>
      }
    </Box>
  );
};

export default PaginationFooter;
