import { isObservable, of, from } from "rxjs";
import { map } from "rxjs/operators";
import { appRequest } from "./AuthorizationService";
import { EmbeddedAppSubject } from "./subjects";
import session from "../util/session";

const EmbeddedAppService = {

  all: function () {
    return this.cache().pipe(
      map(apps => Object.values(apps))
    );
  },

  cache: function () {
    if (isObservable(this.apps)) {
      return this.apps;
    }

    if (this.apps) {
      return of(this.apps);
    }

    return this.apps = from(appRequest({ url: '/meta_config' })).pipe(
      map(({ data: { embedded_apps } }) => this.apps = (embedded_apps || []).reduce(
        (hash, app) => (hash[app.id] = app) && hash, {}
      ))
    );
  },

  getById: function (id) {
    return this.cache().pipe(
      map(apps => apps[id])
    )
  },

  update: function (apps) {
    this.apps = (apps || []).reduce(
      (hash, app) => (hash[app.id] = app) && hash, {}
    );

    Object.values(this.apps).forEach(
      app => EmbeddedAppSubject.for(app.id).computeTitle(app)
    );

    return this.apps;
  },

  refreshAll: function () {
    if (this.apps && !isObservable(this.apps)) {
      const frames = window.frames;
      // const urls = Object.values(this.apps).map(({ url }) => url);
      // urls.forEach(url => {
      //     let i = 0;
      //     while (i < frames.length) {
      //         if (frames[i].location.startsWith(url)) {
      //             frames[i].postMessage({ cmd: 'refresh' }, '*');
      //         }
      //         i++;
      //     }
      // });
      for (let i = 0; i < frames.length; i++) {
        frames[i].postMessage({
          cmd: 'refresh',
          tenantId: session.xTenantId
        }, '*');
      }
    }
  }
};

export default EmbeddedAppService;
