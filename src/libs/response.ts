const APIResponse = ({
  status = 200,
  data = {},
  options = {},
}) => {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
      ...options,
    },
    body: JSON.stringify(data),
  };
}


export { APIResponse }