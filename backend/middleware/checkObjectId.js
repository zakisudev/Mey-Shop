function checkObjectId(req, res, next) {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id <= 0) {
    res.status(404);
    throw new Error(`Invalid ID: ${req.params.id}`);
  }
  next();
}

export default checkObjectId;
