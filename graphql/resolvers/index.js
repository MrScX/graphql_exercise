
const bcrypt = require("bcryptjs");

const Event = require("../../models/event");
const User = require("../../models/user");

const events = evtIds => {

    return Event.find({ _id: { $in: evtIds } })
        .then(events => {

            return events.map(event => {

                return { ...event._doc, creator: user.bind(this, event._doc.creator) };
            });
        })
        .catch(err => {

            console.log(err);
            throw err;
        });
}

const user = uid => {

    return User.findById(uid)
        .then(user => {

            return { ...user._doc, password: null, createdEvents: events.bind(this, user._doc.createdEvents) };
        })
        .catch(err => {

            console.log(err);
            throw err;
        });
}

module.exports = {
    events: () => {
        
        return Event.find()
            .then((events) => {

                return events.map(event => {
                    return { ...event._doc, creator: user.bind(this, event._doc.creator) };
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
                    return { ...user._doc, password: null, createdEvents: events.bind(this, user._doc.createdEvents) };
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

                createdEvent = { ...res._doc, creator: user.bind(this, res._doc.creator) };

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
            .then(user => {
    
                return { ...user._doc, password: null, createdEvents: events.bind(this, user._doc.createdEvents) };
            })
            .catch(err => {

                console.log(err);
                throw err;
            });
    }
}