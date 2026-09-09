import { WebPlugin } from '@capacitor/core';
import { GoogleAuthPlugin, InitOptions, User } from './definitions';
export declare class GoogleAuthWeb extends WebPlugin implements GoogleAuthPlugin {
    gapiLoaded: Promise<void>;
    options: InitOptions;
    constructor();
    loadScript(): void;
    initialize(_options?: Partial<InitOptions>): Promise<void>;
    platformJsLoaded(): void;
    signIn(): Promise<User>;
    refresh(): Promise<{
        accessToken: string;
        idToken: string;
        refreshToken: string;
    }>;
    signOut(): Promise<any>;
    private addUserChangeListener;
    private getUserFrom;
}
