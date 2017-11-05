import {Builder} from '../../src/util/builder'

describe('Builder', () => {
  let subject

  beforeEach(() => {
    subject = new Builder()
  })

  describe('call', () => {
    it('builds a dot from the last value of each series', () => {
      let series = { datapoints: [[1, 'ts'], [2, 'ts']] }
      let dots = subject.call([series])
      expect(dots.length).toEqual(1)
      expect(dots[0].value).toEqual(2)
    })
  })
})
