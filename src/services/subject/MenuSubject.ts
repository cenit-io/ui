import { Observable, of, from } from "rxjs";
import { map, catchError, tap } from "rxjs/operators";
import { BasicSubject } from "./BasicSubject";
import Menu from "../../components/Menu";
import { Config } from '../../common/Symbols';
import { menuIcon } from "./constants";
import Subjects from "./registry";

export class MenuSubject extends BasicSubject {
    static readonly key = 'Menu';
    static readonly type = MenuSubject.key;

    static instance(): MenuSubject {
        let s = Object.values(Subjects).find(
            (s: any) => s.type === MenuSubject.type
        ) as MenuSubject | undefined;
        if (!s) {
            s = new MenuSubject();
            Subjects.add(s);
        }
        return s;
    }

    public TabComponent: any;
    public type: string;

    constructor(attrs: Record<string, any> = {}) {
        super(attrs);
        this.TabComponent = Menu;
        this.type = MenuSubject.type;
        this.key = MenuSubject.key;
    }

    titleObservable(): Observable<string> {
        return of('Quick Access');
    }

    navIcon(): Observable<any> {
        return of(menuIcon);
    }

    config(): Observable<any> {
        if ((MenuSubject as any)[Config]) {
            return of((MenuSubject as any)[Config]);
        }

        return from(
            import(`../../config/Menu.jsx` as any)
        ).pipe(
            map(mod => mod.default),
            catchError((e) => {
                console.error("Failed to load Menu.jsx:", e);
                return of({});
            }),
            tap(config => (MenuSubject as any)[Config] = config)
        );
    }
}
