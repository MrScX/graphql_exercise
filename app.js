
const express = require("express");
const bodyParser = require("body-parser");
const graphqlHttp = require("express-graphql");
const { buildSchema } = require("graphql");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Event = require("./models/event");
const User = require("./models/user");

const app = express();

app.use(bodyParser.json());

app.use("/graphql", graphqlHttp({
    schema: buildSchema(`

        type Event {
            _id: ID!
            title: String!
            description: String!
            price: Float!
            date: String!
            creator: ID!
        }

        type User {
            _id: ID!
            email: String!
            password: String
        }

        input UserInput {
            email: String!
            password: String!
        }

        input EventInput {
            title: String!
            description: String!
            price: Float!
            date: String!
        }

        type RootQuery {
            events: [Event!]!
            users: [User!]!
        }

        type RootMutation {
            createEvent(eventInput: EventInput): Event
            createUser(userInput: UserInput): User
        }

        schema {
            query: RootQuery
            mutation: RootMutation
        }
    `),
    rootValue: {
        events: () => {
            
            return Event.find()
                .then((events) => {

                    return events.map(event => {
                        return { ...event._doc };
                    });

                })
                .catch(err => {

                    console.log(err);
                    throw err;
                });

        },
        users: () => {

            return User.find()
                .then(users => {

                    return users.map(user => {
                        return { ...user._doc, password: null };
                    });
                })
                .catch(err => {

                    console.log(err);
                    throw err;
                });
                
        },
        createEvent: ({ eventInput }) => {
            
            const event = new Event({
                title: eventInput.title,
                description: eventInput.description,
                price: +eventInput.price, // + converts it to a number
                date: new Date(eventInput.date),
                creator: "5d28ba47f1c6b90d9b2df880"
            });

            let createdEvent;

            return event.save()
                .then(res => {

                    createdEvent = { ...res._doc };

                    return User.findById("5d28ba47f1c6b90d9b2df880");
                })
                .then(fetchedUser => {

                    if (!fetchedUser) {
                        throw new Error("User doesn't exist!");
                    }

                    fetchedUser.createdEvents.push(event);

                    return fetchedUser.save();
                })
                .then(res => {
                    return createdEvent;
                })
                .catch(err => {

                    console.log(err);
                    throw err;
                });
        },
        createUser: ({ userInput }) => {

            const salt = 12;

            return User.findOne({
                email: userInput.email
            })
                .then(fetchedUser => {

                    if (fetchedUser) {
                        throw new Error("User already exists");
                    }

                    return bcrypt.hash(userInput.password, salt);
                })
                .then(hash => {

                    const user = new User({
                        email: userInput.email,
                        password: hash
                    });
        
                    return user.save();
                })
                .then(res => {
        
                    return { ...res._doc, password: null };
                })
                .catch(err => {

                    console.log(err);
                    throw err;
                });
        }
    },
    graphiql: true,
}));

mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-zrgrm.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`, {
    useNewUrlParser: true
}).then(() => {

    app.listen(3000, () => {
        console.log("Server started on: 3000");
    });

}).catch(err => console.log(err));

