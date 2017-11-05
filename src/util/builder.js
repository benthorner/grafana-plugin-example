export class Builder {
  call (data) {
    return data.map(series => { 
      return { value: series.datapoints[series.datapoints.length-1][0] }
    })
  }
}
