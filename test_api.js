fetch('http://localhost:3000/api/proxy?path=/games')
  .then(res => res.json())
  .then(console.log)
  .catch(console.error);
