import jestEach from 'jest-each';
import bem from '../src';

describe('bem', () => {
    const b = bem('MyBlock');
    const e = b.createElement('some-element');
    jestEach`
        bemResult                                         | className
        ${b()}                                            | ${'MyBlock'}
        ${b({ active: true })}                            | ${'MyBlock MyBlock--active'}
        ${b({ active: false })}                           | ${'MyBlock'}
        ${b({ active: undefined })}                       | ${'MyBlock'}
        ${b({ mode: 'some-mode' })}                       | ${'MyBlock MyBlock--mode-some-mode'}
        ${b({ active: true, mode: 'some-mode' })}         | ${'MyBlock MyBlock--active MyBlock--mode-some-mode'}
        ${b({}, { active: true })}                        | ${'MyBlock --active'}
        ${b({}, { active: false })}                       | ${'MyBlock'}
        ${b({}, { active: undefined })}                   | ${'MyBlock'}
        ${b({}, { mode: 'some-mode' })}                   | ${'MyBlock --mode-some-mode'}
        ${b({}, { active: true, mode: 'some-mode' })}     | ${'MyBlock --active --mode-some-mode'}
        ${b.e('some-element')}                            | ${'MyBlock__some-element'}
        ${b.e('some-element', { active: true })}          | ${'MyBlock__some-element MyBlock__some-element--active'}
        ${b.e('some-element', { active: false })}         | ${'MyBlock__some-element'}
        ${b.e('some-element', { active: undefined })}     | ${'MyBlock__some-element'}
        ${b.e('some-element', { mode: 'sm' })}            | ${'MyBlock__some-element MyBlock__some-element--mode-sm'}
        ${b.e('some-element', {}, { active: true })}      | ${'MyBlock__some-element --active'}
        ${b.e('some-element', {}, { active: false })}     | ${'MyBlock__some-element'}
        ${b.e('some-element', {}, { active: undefined })} | ${'MyBlock__some-element'}
        ${b.e('some-element', {}, { mode: 'some-mode' })} | ${'MyBlock__some-element --mode-some-mode'}
        ${e()}                                            | ${'MyBlock__some-element'}
        ${e({ active: true })}                            | ${'MyBlock__some-element MyBlock__some-element--active'}
        ${e({ active: false })}                           | ${'MyBlock__some-element'}
        ${e({ active: undefined })}                       | ${'MyBlock__some-element'}
        ${e({ mode: 'sm' })}                              | ${'MyBlock__some-element MyBlock__some-element--mode-sm'}
        ${e({}, { active: true })}                        | ${'MyBlock__some-element --active'}
        ${e({}, { active: false })}                       | ${'MyBlock__some-element'}
        ${e({}, { active: undefined })}                   | ${'MyBlock__some-element'}
        ${e({}, { mode: 'some-mode' })}                   | ${'MyBlock__some-element --mode-some-mode'}
    `.it('should convert expression to $className', ({ bemResult, className }) => {
        expect(bemResult).toBe(className);
    });
});
