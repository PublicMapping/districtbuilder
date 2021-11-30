/** @jsx jsx */
import { Component } from "react";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";
import { jsx } from "theme-ui";
import { IProject, IStaticMetadata, IUser } from "../../shared/entities";
import { patchUser } from "../api";
import { geoLevelLabel, getPopulationPerRepresentative } from "../functions";
import { ReactComponent as SalamanderIllustration } from "../media/tour-salamander-builder.svg";
import { DistrictsGeoJSON } from "../types";
import { Styled } from "theme-ui";

/* eslint-disable */
interface Props {
  readonly geojson: DistrictsGeoJSON;
  readonly project: IProject;
  readonly staticMetadata: IStaticMetadata;
  readonly user: IUser;
}

interface State {
  readonly run: boolean;
  readonly steps: Step[];
}

class Tour extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const numberOfDistricts = props.project.numberOfDistricts;
    const population = Math.round(
      getPopulationPerRepresentative(props.geojson, props.project.numberOfMembers)
    ).toLocaleString();
    const regionConfig = props.project.regionConfig.name;
    const geoLevelsSingular = props.staticMetadata.geoLevelHierarchy
      .map(geolevel => geolevel.id)
      .reverse();
    const largestGeoLevelSingular = geoLevelsSingular[0];
    const geoLevelsPlural = geoLevelsSingular.map(label => geoLevelLabel(label).toLowerCase());
    const largestGeoLevelPlural = geoLevelsPlural[0];
    const availableGeolevelsText =
      geoLevelsPlural.length > 2
        ? `${geoLevelsPlural.slice(0, -1).join(", ")}, and ${
            geoLevelsPlural[geoLevelsPlural.length - 1]
          }`
        : geoLevelsPlural.length == 2
        ? `${largestGeoLevelPlural} and ${geoLevelsPlural[1]}`
        : largestGeoLevelPlural;

    this.state = {
      run: !props.user.hasSeenTour,
      steps: [
        {
          title: "Welcome to DistrictBuilder!",
          content: (
            <div>
              <SalamanderIllustration width="135px" />
              <p>
                Do you want help building
                <br />
                your first map?
              </p>
            </div>
          ),
          locale: {
            skip: <strong aria-label="skip">No, thanks</strong>,
            next: <span aria-label="next">Yes, please</span>
          },
          floaterProps: {
            styles: {
              arrow: {
                length: 0,
                margin: 0
              }
            }
          },
          showProgress: false,
          placement: "top-start",
          disableOverlay: true,
          disableBeacon: true,
          target: "#tour-start",
          styles: {
            options: {
              width: 300
            },
            tooltipContainer: {
              textAlign: "center"
            }
          }
        },
        {
          content: (
            <p>
              Great! I’ll walk you through some redistricting basics and show you how to get started
              with DistrictBuilder.
            </p>
          ),
          placement: "center",
          target: "body",
          styles: {
            options: {
              width: 350
            },
            tooltipContainer: {
              textAlign: "center"
            }
          }
        },
        {
          content: (
            <p>
              Your objective: build <strong>{numberOfDistricts} districts</strong> for{" "}
              <strong>{regionConfig}, </strong>
              each with a population of <strong>{population}</strong> per representative. Use
              DistrictBuilder to group {availableGeolevelsText} into districts.
            </p>
          ),
          disableBeacon: true,
          placement: "center",
          target: "body",
          styles: {
            options: {
              width: 500
            },
            tooltipContainer: {
              textAlign: "center"
            }
          }
        },
        {
          content:
            "The sidebar lists all your districts and their stats. Each district is represented by a unique color and number.",
          placement: "right-start",
          disableBeacon: true,
          target: ".map-sidebar",
          styles: {
            options: {
              width: 350
            }
          }
        },
        {
          content: (
            <div>
              <p>
                Each district has a target population – the number of people who need to live there
                to maintain equal population districts.
              </p>
              <p>
                The <strong>deviation</strong> column tells you how far off a district is from that
                target. A negative deviation means you need to add more people to that district, and
                a positive deviation means you need to remove people from that district. Try to{" "}
                <strong>minimize deviation for each district</strong> while maintaining fair,
                representative districts.
              </p>
            </div>
          ),
          placement: "auto",
          disableBeacon: true,
          target: ".deviation-header",
          styles: {
            options: {
              width: 400
            }
          }
        },
        {
          content: (
            <p>
              The ∅ row is special. It is not a regular district, but represents the population of
              any areas <strong>not yet assigned to a district.</strong> As you create your
              districts, this number gets smaller.
            </p>
          ),
          placement: "right",
          disableBeacon: true,
          spotlightClicks: true,
          target: ".unassigned-row",
          styles: {
            options: {
              width: 450
            }
          }
        },
        {
          content: (
            <div>
              <Styled.div
                sx={{
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderRadius: "2px",
                  borderColor: "gray.2",
                  lineHeight: "0"
                }}
              >
                <img
                  src={require("../media/tour-clicking-counties-sidebar.gif")}
                  width="100%"
                  height="auto"
                  alt="User clicks on two geounits in the application and the sidebar updates."
                />
              </Styled.div>
              <p>
                We’re ready to start building! By default, District 1 is selected in the sidebar. As
                you add {largestGeoLevelPlural}, you can see the population of District 1 increase.
              </p>
              <Styled.div sx={{ bg: "success.1", color: "success.8", borderRadius: "2", p: 3 }}>
                <strong>Try it now:</strong> click on a {largestGeoLevelSingular} on the map to add
                it to District 1.
              </Styled.div>
            </div>
          ),
          placement: "left",
          disableBeacon: true,
          isFixed: true,
          target: ".mapboxgl-map",
          styles: {
            options: {
              width: 350
            }
          }
        },
        {
          content: (
            <div>
              <p>
                When you are happy with District 1, click “Accept” to save your changes. The{" "}
                {largestGeoLevelPlural} you selected will turn green, matching the color of District
                1, meaning they have been saved to District 1.
              </p>
            </div>
          ),
          placement: "right-start",
          disableBeacon: true,
          target: ".sidebar-header",
          styles: {
            options: {
              width: 400
            }
          }
        },
        {
          content: (
            <div>
              <Styled.div
                sx={{
                  maxWidth: "250px",
                  mx: "auto",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderRadius: "2px",
                  borderColor: "gray.2",
                  lineHeight: "0"
                }}
              >
                <img
                  src={require("../media/tour-counties-blockgroups.gif")}
                  width="100%"
                  height="auto"
                  alt="User toggles geolevel selection"
                />
              </Styled.div>
              {geoLevelsPlural.length === 1 ? (
                <p>
                  The only census boundary available for this map is {largestGeoLevelPlural}. Try to
                  evenly distribute the population between all districts the best you can.
                </p>
              ) : (
                <p>
                  We recommend starting your map with {largestGeoLevelPlural} because they are the
                  largest census boundary available for this map. Try to evenly distribute the
                  population between all districts the best you can.
                </p>
              )}
              {geoLevelsPlural.length === 1 ? null : (
                <p>
                  Working with {largestGeoLevelPlural} is like using a large paint roller – great
                  for covering a lot of ground quickly, but eventually you need a more detailed tool
                  around the edges. Switch to {geoLevelsPlural[1]} to make finer level changes to
                  your map and get even closer to zero deviation.
                </p>
              )}
            </div>
          ),
          placement: "auto",
          disableBeacon: true,
          target: ".geolevel-button-group",
          styles: {
            options: {
              width: 500
            }
          }
        },
        {
          content: (
            <p>
              You can find additional tutorials and contact us in the <strong>Resources</strong>{" "}
              menu. Thank you for using DistrictBuilder and fighting for fair and transparent
              redistricting!
            </p>
          ),
          placement: "auto",
          disableBeacon: true,
          target: ".support-menu",
          styles: {
            options: {
              width: 400
            }
          }
        }
      ]
    };
  }

  private handleJoyrideCallback(data: CallBackProps) {
    const { status } = data;
    const finishedStatuses: readonly string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      this.setState({ run: false });
      void patchUser({ hasSeenTour: true });
    }
  }

  public render() {
    const { run, steps } = this.state;

    return (
      <Joyride
        callback={data => this.handleJoyrideCallback(data)}
        continuous={true}
        run={run}
        scrollToFirstStep={false}
        showProgress={true}
        showSkipButton={true}
        spotlightClicks={true}
        locale={{
          skip: <strong aria-label="skip">Skip tour</strong>
        }}
        steps={steps}
        disableOverlayClose={true}
        disableScrolling={true}
        disableScrollParentFix={true}
        spotlightPadding={10}
        floaterProps={{
          styles: {
            floater: {
              filter: "drop-shadow(0 0 5px rgba(0, 0, 0, 0.5))"
            },
            arrow: {
              length: 12,
              margin: 3
            }
          }
        }}
        styles={{
          options: {
            arrowColor: "#fff",
            backgroundColor: "#fff",
            overlayColor: "rgba(20, 20, 20, 0.4)",
            primaryColor: "#6d98ba",
            textColor: "#595959",
            width: 500,
            zIndex: 1000
          },
          beacon: {
            display: "none"
          },
          tooltip: {
            borderRadius: "3px"
          },
          tooltipContainer: {
            textAlign: "left"
          },
          tooltipTitle: {
            fontSize: 21,
            color: "#141414",
            fontWeight: "normal",
            fontFamily:
              'frank-new, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif'
          },
          buttonClose: {
            display: "none"
          },
          buttonNext: {
            borderRadius: "3px",
            fontFamily:
              'frank-new, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif'
          },
          buttonBack: {
            fontSize: 14,
            color: "#395c78",
            fontWeight: "bold"
          },
          buttonSkip: {
            fontSize: 14,
            color: "#395c78",
            fontWeight: "bold"
          },
          tooltipContent: {
            padding: "20px 10px 5px"
          }
        }}
      />
    );
  }
}
/* eslint-enable */

export default Tour;
