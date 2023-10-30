import {BehaviorSubject, Observable, ReplaySubject} from "rxjs";
import {ChatUserTypingState} from "./chat-user-typing-state.enum";
import {UserProfile} from "../user-profile/user-profile";
import {UserProfileColor} from "../common/user-profile-color.enum";

export abstract class ChatMember {
    public abstract get id(): string;
    public abstract get username(): string;
    public abstract get displayName(): string;
    public abstract get avatarId(): string | undefined;
    public abstract get color(): UserProfileColor;

    public abstract get avatarPhotoUrl$(): Observable<string> | undefined;

    public readonly chatTypingStateInfo$: BehaviorSubject<ChatTypingStateInfo | undefined> = new BehaviorSubject<ChatTypingStateInfo | undefined>(undefined);
    public get chatTypingStateInfo() { return this.chatTypingStateInfo$.value; };

    public abstract get isOnline$(): BehaviorSubject<boolean>;
    public get isOnline() { return this.isOnline$.value; };

    protected constructor() {

    }
}

export class UserChatMember extends ChatMember {
    userProfile: UserProfile;

    private _displayName: string;

    constructor(userProfile: UserProfile) {
        super();

        this.userProfile = userProfile;

        this._displayName = this.userProfile.name + ' ' + this.userProfile.surname;
    }

    public get isOnline$(): BehaviorSubject<boolean> {
        return this.userProfile.isOnline$;
    };

    get avatarId(): string | undefined {
        return this.userProfile.avatarPhotoId;
    }

    get avatarPhotoUrl$(): Observable<string> | undefined {
        return this.userProfile.avatarPhotoUrl$;
    }

    get displayName(): string {
        return this._displayName;
    }

    get id(): string {
        return this.userProfile.id;
    }

    get username(): string {
        return this.userProfile.username;
    }

    get color(): UserProfileColor {
        return this.userProfile.color;
    }
}

export interface ChatTypingStateInfo {
    chatId: string;
    state: ChatUserTypingState;
}
