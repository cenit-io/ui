export const JustOneParameter = {
    parameters_size: 1
};

export const AtLeastOneParameter = {
    parameters_size: {
        $gte: 1
    }
};

export const OneOrTwoParameters = {
    $or: [
        { parameters_size: 1 },
        { parameters_size: 2 }
    ]
};
