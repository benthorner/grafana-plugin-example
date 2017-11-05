export class Presenter {
  constructor(panel) {
    this.panel = panel
  }

  call (dots) {
    dots.forEach(dot => {
      this.panel.thresholds.forEach(threshold => {
        if (dot.value > parseFloat(threshold.value)) {
          dot.color = threshold.color
        }
      })
    })
  }
}
