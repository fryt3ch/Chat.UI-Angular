export enum UserProfileColor {
    blue = 0,
    green = 1,
    orange = 2,
    red = 3,
    purple = 4,
    lightBlue = 5,
    pink = 6,
}

export class UserProfileColorProperties {
    hex: string;

    constructor(hex: string) {
        this.hex = hex;
    }
}

const userProfileColors: Record<UserProfileColor, UserProfileColorProperties> = {
    [UserProfileColor.blue]: new UserProfileColorProperties('#5DADDF'),
    [UserProfileColor.green]: new UserProfileColorProperties('#79CA7B'),
    [UserProfileColor.orange]: new UserProfileColorProperties('#E39652'),
    [UserProfileColor.red]: new UserProfileColorProperties('#E35A62'),
    [UserProfileColor.purple]: new UserProfileColorProperties('#A480DD'),
    [UserProfileColor.lightBlue]: new UserProfileColorProperties('#59C1D0'),
    [UserProfileColor.pink]: new UserProfileColorProperties('#E75089'),
};

export function getUserProfileColorProperties(color: UserProfileColor): UserProfileColorProperties {
    return userProfileColors[color];
}
