const dataMethod = ["body", "params", "query", "headers"];
export const validation = (schema) => {
    return (req, res, next) => {
        let validationArr = [];
        dataMethod.forEach(key => {
            if (schema[key]) {
                const validationResult = schema[key].validate(req[key], { abortEarly: false })
                if (validationResult?.error) {
                    validationArr.push(validationResult.error.details);
                }
                if (validationArr.length) {
                    res.status(400).json({ message: " Validation error", validationArr })
                } else {
                    next();
                }
            }
        })
    }
}
