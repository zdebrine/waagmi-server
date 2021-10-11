const formatString = (string) => {
    if (string === null) {
      return "";
    } else {
      let returnString = "";
      const regex = /'/g;
      returnString = string.replace(regex, "''");
      return returnString;
    }
  };
  
  module.exports = formatString;