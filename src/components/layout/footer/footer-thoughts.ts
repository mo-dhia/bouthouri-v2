type Point = { x: number; y: number };
const unit = (n: number) => Math.max(0, Math.min(1, n));

/** The thought grows in small material cells from the selected identity piece. */
export class FooterThoughts {
  private readonly canvas = document.createElement("canvas");
  readonly mobile: boolean;
  readonly x: number;
  readonly y: number;
  readonly titleSize: number;
  private readonly width: number;
  private readonly row: number;
  private readonly ratio: number;
  constructor(
    width: number,
    height: number,
    private readonly rtl: boolean,
    labels: string[][],
    family: string,
  ) {
    this.mobile = width < 680;
    this.x = width * (this.mobile ? 0.06 : 0.055);
    this.y = this.mobile ? -2 : 0.22 * height;
    this.width = Math.ceil(width * (this.mobile ? 0.88 : 0.425));
    this.row = Math.ceil(this.mobile ? 108 : 0.65 * height);
    this.titleSize = this.mobile
      ? Math.min(33, 0.085 * width)
      : Math.min(61, 0.043 * width);
    const bodySize = this.mobile
      ? Math.min(16, 0.041 * width)
      : Math.min(23, 0.019 * width);
    this.ratio = Math.min(2, Math.max(1.5, devicePixelRatio || 1));
    this.canvas.width = Math.ceil(this.width * this.ratio);
    this.canvas.height = Math.ceil(3 * this.row * this.ratio);
    const ctx = this.canvas.getContext("2d")!;
    ctx.scale(this.ratio, this.ratio);
    ctx.fillStyle = "#dbd8d0";
    ctx.direction = rtl ? "rtl" : "ltr";
    ctx.textAlign = rtl ? "right" : "left";
    ctx.textBaseline = "top";
    const write = (text: string, y: number) => {
      const m = ctx.measureText(text),
        x = rtl
          ? this.width - 2 - m.actualBoundingBoxRight
          : 2 + m.actualBoundingBoxLeft;
      ctx.fillText(text, x, y);
    };
    labels.forEach(([title, thought], i) => {
      let size = this.titleSize;
      ctx.font = `400 ${size}px ${family}`;
      const measured = ctx.measureText(title).width;
      if (measured > this.width - 4) {
        size *= (this.width - 4) / measured;
        ctx.font = `400 ${size}px ${family}`;
      }
      write(title, i * this.row + 2);
      const leading = size * (rtl ? 1.7 : 1.65);
      ctx.font = `400 ${bodySize}px ${family}`;
      thought
        .split("\n")
        .forEach((line, row) =>
          write(line, i * this.row + leading + row * bodySize * 1.5),
        );
    });
  }
  draw(
    ctx: CanvasRenderingContext2D,
    concept: number,
    reveal: number,
    origin: Point,
    departing: boolean,
    reduced: boolean,
  ) {
    if (reveal >= 0.9999) {
      ctx.drawImage(
        this.canvas,
        0,
        concept * this.row * this.ratio,
        this.width * this.ratio,
        this.row * this.ratio,
        this.x,
        this.y,
        this.width,
        this.row,
      );
      return;
    }
    if (reveal <= 0) return;
    const columns = reduced ? 12 : 32,
      cellWidth = this.width / columns,
      cellHeight = this.row / 8;
    for (let row = 0; row < 8; row++)
      for (let column = 0; column < columns; column++) {
        const u = (column + 0.5) / columns,
          v = (row + 0.5) / 8;
        const direction = this.rtl ? 1 - u : this.mobile ? v : 1 - u;
        const delay = departing
          ? (1 - direction) * 0.18 + 0.05 * v
          : 0.12 * direction + 0.22 * Number(v > 0.38);
        const progress = unit((reveal - delay) / (1 - delay));
        if (progress < 0.002) continue;
        const x = this.x + column * cellWidth,
          y = this.y + row * cellHeight;
        const bow = reduced
          ? 0
          : Math.sin(progress * Math.PI) * Math.sin(u * Math.PI) * 5;
        ctx.drawImage(
          this.canvas,
          column * cellWidth * this.ratio,
          (concept * this.row + row * cellHeight) * this.ratio,
          cellWidth * this.ratio,
          cellHeight * this.ratio,
          origin.x + (x - origin.x) * progress + (this.mobile ? bow : 0),
          origin.y + (y - origin.y) * progress + (this.mobile ? 0 : bow),
          cellWidth * progress + 0.15 * progress,
          cellHeight * progress + 0.15 * progress,
        );
      }
  }
  dispose() {
    this.canvas.width = this.canvas.height = 1;
  }
}
