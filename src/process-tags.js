const path = require("path");

function getDate() {
    var d = new Date();

    return `${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()}`;
}

module.exports = ({ content, name }, _, arr) => {
  let newContent = content;
  
  newContent = content.replace(/__lastupdated__/, getDate());

  return { content: newContent, name };
};
