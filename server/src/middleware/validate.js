/**
 * Validates request payload against a schema/validator function
 * @param {Function} validatorFn - Function returning { isValid: boolean, errors: Array }
 */
const validate = (validatorFn) => {
  return (req, res, next) => {
    const result = validatorFn(req.body, req);
    if (!result.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.errors || [],
      });
    }
    next();
  };
};

module.exports = validate;
