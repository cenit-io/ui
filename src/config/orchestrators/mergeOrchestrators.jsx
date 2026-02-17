import { isObservable, of } from "rxjs";
import { map } from "rxjs/operators";
import { deepMergeObjectsOnly } from "../../common/merge";
import zzip from "../../util/zzip";

export default function (...orchestrators) {
  return function (value, state, formValue, props) {
    const observables = [];
    let mergedState = {};
    let touched = false;
    orchestrators.forEach(orchestrator => {
      const nextState = orchestrator(value, state, formValue, props);
      if (nextState) {
        touched = true;
        if (isObservable(nextState)) {
          observables.push(nextState);
        } else {
          mergedState = deepMergeObjectsOnly(mergedState, nextState);
        }
      } else {
        mergedState = deepMergeObjectsOnly(state, mergedState);
      }
    });

    if (observables.length) {
      return zzip(of(mergedState), ...observables).pipe(
        map(([mergedState, ...states]) => {
          states.forEach(nextState => mergedState = deepMergeObjectsOnly(mergedState, nextState));
          if (Object.keys(mergedState).length) {
            return mergedState;
          }

          return of(undefined);
        })
      )
    }

    if (touched) {
      return mergedState;
    }
  }
}
