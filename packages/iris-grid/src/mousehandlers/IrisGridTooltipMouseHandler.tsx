import {
  type EventHandlerResult,
  type Grid,
  type GridPoint,
  isLinkToken,
  GridTooltipMouseHandler,
  type GridRangeIndex,
} from '@deephaven/grid';
import deepEqual from 'fast-deep-equal';
import type IrisGrid from '../IrisGrid';

class IrisGridTooltipMouseHandler extends GridTooltipMouseHandler {
  private irisGrid: IrisGrid;

  private lastColumn: GridRangeIndex;

  private lastRow: GridRangeIndex;

  constructor(irisGrid: IrisGrid) {
    super();

    this.irisGrid = irisGrid;
    this.lastColumn = null;
    this.lastRow = null;
  }

  private destroyTooltip(): void {
    this.irisGrid.setState({ hoverTooltipProps: null });
  }

  protected setCursor(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    if (this.isHoveringLink(gridPoint, grid)) {
      this.cursor = 'pointer';
      return { stopPropagation: false, preventDefault: false };
    }
    this.cursor = null;
    return false;
  }

  onMove(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    const { model } = this.irisGrid.props;
    const isUserHoveringLink = this.isHoveringLink(gridPoint, grid);
    const dateTooltip = model.tooltipForCell(gridPoint.column, gridPoint.row);

    if (
      isUserHoveringLink &&
      this.currentLinkBox != null &&
      isLinkToken(this.currentLinkBox.token)
    ) {
      const { hoverTooltipProps } = this.irisGrid.state;
      if (this.currentLinkBox == null) {
        return false;
      }
      const { x1: left, y1: top, x2: right, y2: bottom } = this.currentLinkBox;
      const { href } = this.currentLinkBox.token;
      const width = right - left;
      const height = bottom - top;
      const newProps = { left, top: top + 1, width, height };
      if (!deepEqual(hoverTooltipProps, newProps)) {
        this.irisGrid.setState({
          hoverTooltipProps: newProps,
          hoverDisplayValue: (
            <>
              {href} - Click once to follow.
              <br />
              Click and hold to select this cell.
            </>
          ),
        });
      }
    } else if (dateTooltip !== null) {
      const { hoverTooltipProps } = this.irisGrid.state;
      const newProps = {
        left: gridPoint.x,
        top: gridPoint.y,
        width: 1,
        height: 1,
      };
      if (!deepEqual(hoverTooltipProps, newProps)) {
        if (hoverTooltipProps == null) {
          this.irisGrid.setState({
            hoverTooltipProps: newProps,
            hoverDisplayValue: dateTooltip,
          });
        } else if (
          this.lastColumn !== gridPoint.column ||
          this.lastRow !== gridPoint.row
        ) {
          this.irisGrid.setState(
            {
              hoverTooltipProps: null,
            },
            () =>
              this.irisGrid.setState({
                hoverTooltipProps: newProps,
                hoverDisplayValue: dateTooltip,
              })
          );
        }
      }
    } else {
      this.destroyTooltip();
    }

    this.lastColumn = gridPoint.column;
    this.lastRow = gridPoint.row;

    return this.setCursor(gridPoint, grid);
  }

  onDown(): EventHandlerResult {
    this.destroyTooltip();
    return false;
  }

  onContextMenu(): EventHandlerResult {
    this.destroyTooltip();
    return false;
  }

  onWheel(): EventHandlerResult {
    this.destroyTooltip();
    return false;
  }

  onLeave(): EventHandlerResult {
    this.destroyTooltip();
    return false;
  }
}

export default IrisGridTooltipMouseHandler;