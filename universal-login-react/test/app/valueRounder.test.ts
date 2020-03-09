import {expect} from 'chai';
import {ValueRounder} from '../../src/app/valueRounder';

describe('UNIT: valueRounder', () => {
  describe('Ceil', () => {
    it('value is \'\'', () => {
      expect(() => ValueRounder.ceil((''))).throws('String is not a number');
    });

    it('value is not a number', () => {
      expect(() => ValueRounder.ceil(('bbb'))).throws('String is not a number');
    });

    it('round 1.0001 to 1.001', () => {
      expect(ValueRounder.ceil('1.0001')).to.be.eq('1.001');
    });

    it('round 0.099999 to 0.1', () => {
      expect(ValueRounder.ceil('0.099999')).to.be.eq('0.1');
    });

    it('round 123.9981 to 123.999', () => {
      expect(ValueRounder.ceil('123.9981')).to.be.eq('123.999');
    });
  });

  describe('Floor', () => {
    it('value is \'\'', () => {
      expect(() => ValueRounder.floor((''))).throws('String is not a number');
    });

    it('value is not a number', () => {
      expect(() => ValueRounder.floor(('bbb'))).throws('String is not a number');
    });

    it('round 123.9991 to 123.999', () => {
      expect(ValueRounder.floor('123.9991')).to.be.eq('123.999');
    });

    it('round 0.99999999 to 0.999', () => {
      expect(ValueRounder.floor('0.99999999')).to.be.eq('0.999');
    });

    it('round 0.1 to 0.1', () => {
      expect(ValueRounder.floor('0.1')).to.be.eq('0.1');
    });

    it('round 0 to 0.0', () => {
      expect(ValueRounder.floor('0')).to.be.eq('0.0');
    });
  });
});
