// i: array of data and email to check
// o: account number present in object of the user email is within the dataset

const findAccount = (data, email) => {
    for (let i = 0; i < data.length; i++) {
      if (data[i].email === email) {
        return data[i].id;
      }
    }
  };
  
  module.exports = findAccount;