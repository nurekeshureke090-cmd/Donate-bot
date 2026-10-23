fetch('http://localhost:3001/?path=/games')
  .then(res => res.json())
  .then(console.log)
  .catch(console.error);
