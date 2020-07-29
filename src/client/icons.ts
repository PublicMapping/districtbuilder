export interface Svg {
  readonly viewBox: string;
  readonly path: string;
}

const icons = {
  search: {
    viewBox: "0 0 512 512",
    path:
      "M505 442.7L405.3 343c-4.5-4.5-10.6-7-17-7H372c27.6-35.3 44-79.7 44-128C416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c48.3 0 92.7-16.4 128-44v16.3c0 6.4 2.5 12.5 7 17l99.7 99.7c9.4 9.4 24.6 9.4 33.9 0l28.3-28.3c9.4-9.4 9.4-24.6.1-34zM208 336c-70.7 0-128-57.2-128-128 0-70.7 57.2-128 128-128 70.7 0 128 57.2 128 128 0 70.7-57.2 128-128 128z"
  },
  "hand-pointer": {
    viewBox: "0 0 1000 1000",
    path:
      "M699.6 350.3C661.5 301.9 596.7 287.9 543.6 313 514 282.4 472.9 269.1 433 274.7V130.9C433 58.7 375 0 303.6 0S174.1 58.7 174.1 130.9V445.6C135.2 431.1 89.6 435.6 52.9 462.9-4.5 505.5-17.1 586.6 24.4 644.8L238.7 945.6C263 979.7 302.2 1000 343.8 1000H692C752.1 1000 804.4 958 818.1 898.8L871.6 666.4A132.6 132.6 0 0 0 875 636.7V472.7C875 381.2 783.9 317.8 699.6 350.3ZM158.2 546.3L211.2 620.7C228.7 645.3 267.9 632.9 267.9 602.5V130.9C267.9 81.8 339.3 81.7 339.3 130.9V472.7C339.3 489.9 353.3 503.9 370.5 503.9H383.9C401.2 503.9 415.2 489.9 415.2 472.7V404.3C415.2 355.2 486.6 355.2 486.6 404.3V472.7C486.6 489.9 500.6 503.9 517.9 503.9H531.3C548.5 503.9 562.5 489.9 562.5 472.7V431.6C562.5 382.6 633.9 382.5 633.9 431.6V472.7C633.9 489.9 647.9 503.9 665.2 503.9H678.6C695.8 503.9 709.8 489.9 709.8 472.7 709.8 423.6 781.2 423.5 781.2 472.7V636.7C781.2 639.6 780.9 642.5 780.3 645.4L726.7 877.8C722.8 894.5 708.5 906.3 692 906.3H343.8C332.5 906.3 321.8 900.6 315 891.2L100.8 590.4C72.6 550.9 130 506.8 158.2 546.3ZM344 781.3V593.8C344 576.5 356.3 562.5 371.4 562.5H383.1C398.2 562.5 410.4 576.5 410.4 593.8V781.3C410.4 798.5 398.2 812.5 383.1 812.5H371.4C356.3 812.5 344 798.5 344 781.3ZM491.3 781.3V593.8C491.3 576.5 503.6 562.5 518.7 562.5H530.4C545.5 562.5 557.8 576.5 557.8 593.8V781.3C557.8 798.5 545.5 812.5 530.4 812.5H518.7C503.6 812.5 491.3 798.5 491.3 781.3ZM638.7 781.3V593.8C638.7 576.5 650.9 562.5 666 562.5H677.7C692.8 562.5 705.1 576.5 705.1 593.8V781.3C705.1 798.5 692.8 812.5 677.7 812.5H666C650.9 812.5 638.7 798.5 638.7 781.3Z"
  },
  "draw-square": {
    viewBox: "0 0 1000 1000",
    path:
      "M796.9 696.8V303.2C842.7 284.7 875 239.9 875 187.5 875 118.5 819 62.5 750 62.5 697.6 62.5 652.8 94.8 634.3 140.6H240.7C222.2 94.8 177.4 62.5 125 62.5 56 62.5 0 118.5 0 187.5 0 239.9 32.3 284.7 78.1 303.2V696.8C32.3 715.3 0 760.1 0 812.5 0 881.5 56 937.5 125 937.5 177.4 937.5 222.2 905.2 240.7 859.4H634.3C652.8 905.2 697.6 937.5 750 937.5 819 937.5 875 881.5 875 812.5 875 760.1 842.7 715.3 796.9 696.8ZM171.9 696.8V303.2A125.1 125.1 0 0 0 240.7 234.4H634.3A125.1 125.1 0 0 0 703.1 303.2V696.8A125.1 125.1 0 0 0 634.3 765.6H240.7A125.1 125.1 0 0 0 171.9 696.8ZM750 156.3C767.2 156.3 781.3 170.3 781.3 187.5S767.2 218.8 750 218.8 718.8 204.7 718.8 187.5 732.8 156.3 750 156.3ZM125 156.3C142.2 156.3 156.3 170.3 156.3 187.5S142.2 218.8 125 218.8 93.8 204.7 93.8 187.5 107.8 156.3 125 156.3ZM125 843.8C107.8 843.8 93.8 829.7 93.8 812.5S107.8 781.3 125 781.3 156.3 795.3 156.3 812.5 142.2 843.8 125 843.8ZM750 843.8C732.8 843.8 718.8 829.7 718.8 812.5S732.8 781.3 750 781.3 781.3 795.3 781.3 812.5 767.2 843.8 750 843.8Z"
  },
  "times-circle": {
    viewBox: "0 0 1000 1000",
    path:
      "M500 15.6C232.4 15.6 15.6 232.4 15.6 500S232.4 984.4 500 984.4 984.4 767.6 984.4 500 767.6 15.6 500 15.6ZM500 890.6C284.2 890.6 109.4 715.8 109.4 500S284.2 109.4 500 109.4 890.6 284.2 890.6 500 715.8 890.6 500 890.6ZM698.8 378.5L577.3 500 698.8 621.5C708 630.7 708 645.5 698.8 654.7L654.7 698.8C645.5 708 630.7 708 621.5 698.8L500 577.3 378.5 698.8C369.3 708 354.5 708 345.3 698.8L301.2 654.7C292 645.5 292 630.7 301.2 621.5L422.7 500 301.2 378.5C292 369.3 292 354.5 301.2 345.3L345.3 301.2C354.5 292 369.3 292 378.5 301.2L500 422.7 621.5 301.2C630.7 292 645.5 292 654.7 301.2L698.8 345.3C708 354.5 708 369.3 698.8 378.5Z"
  }
};

export default icons;
