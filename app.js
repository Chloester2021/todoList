//jshint esversion:6

const express = require("express");
const mongoose = require("mongoose");
const app = express();
const _ = require('lodash');

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://Admin-cfang:TestChloeFang@cluster0.bmjey.mongodb.net/todolistDB");
const itemSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({ name: "Welcome to the todo list" });
const item2 = new Item({ name: "Hit the + to add a new item." });
const item3 = new Item({ name: "Hit the checkbox to delete an item." });
const defaultArray = [item1, item2, item3];
const listSchema = {
  name: String,
  items: [itemSchema],
};

const List = mongoose.model("List", listSchema);



app.get("/", function (req, res) {
  // use mongoose to tap into the DB. find method returns an array so you cannot tap the property using item.name
  Item.find({}, function (err, items) {
    if (items.length === 0) {
      Item.insertMany(defaultArray, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("success");
        }
      });
      res.redirect("/");
      // only work in the first time when the DB is empty. Then it redirect to home route and render db to list.
    } else {
      res.render("list", { listTitle: "Today", newListItems: items });
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list
  // new document item
  const item = new Item({
    name: itemName,
  });
  if (listName === "Today"){
    item.save();
    res.redirect("/");
  }else{
    // /findOne returns an object so you can use item.name to tap into the value.
    List.findOne({name:listName},function(err,foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })

  }

});

app.post("/delete", function (req, res) {
  const checkboxID = req.body.checkbox;
  const listName = req.body.listName;
  
  if (listName === "Today"){
    Item.deleteOne({ _id: checkboxID }, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("successfully deleted checked item");
      }
    });
    res.redirect("/");
  }else{
    List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkboxID}}},function(err,foundList){
      if (!err){
        res.redirect("/" + listName);
      }
    })

  }
  
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  // findone returns an object
  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        //  create a new list
        const lists = new List({
          name: customListName,
          items: defaultArray,
        });
        lists.save();
        //  create a new list and show the custom route
        res.redirect("/" + customListName);
      } else {
        //  show an existing list
        res.render("list", {
          listTitle: customListName,
          newListItems: foundList.items,
        });
      }
    }
  });
});


app.get("/infor/about", function (req, res) {
  res.render("about");
});


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}


app.listen(port, function () {
  console.log("At your service 😊");
});
