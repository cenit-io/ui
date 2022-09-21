import { zip, of } from 'rxjs';

const zzip = (...args) => {
  if (args.length) {
    return zip(...args);
  }
  return of([]);
}

export default zzip;
