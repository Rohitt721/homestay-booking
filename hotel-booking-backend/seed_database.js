const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const mongoURI = 'mongodb://127.0.0.1:27017/hotel-booking';

const seedUsers = [
    {
        _id: "6554f2ecd4f07417501dcbf1",
        email: "1@1.com",
        password: "password123",
        firstName: "Test",
        lastName: "User",
        role: "user"
    },
    {
        email: "admin@test.com",
        password: "password123",
        firstName: "Admin",
        lastName: "User",
        role: "admin"
    },
    {
        email: "owner@test.com",
        password: "password123",
        firstName: "Hotel",
        lastName: "Owner",
        role: "hotel_owner"
    }
];

const seedHotel = {
    _id: "6566072befbb78591fadc606",
    userId: "6554f2ecd4f07417501dcbf1",
    name: "Dublin Getaways",
    city: "Dublin",
    country: "Ireland",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus ultricies sodales rhoncus. Mauris nisl sapien, interdum vitae mi et, porttitor faucibus velit. Duis quis nisl feugiat, volutpat leo a, efficitur lectus. Praesent vulputate turpis nec sapien vulputate tincidunt. Maecenas vitae aliquam ipsum. Ut ultricies hendrerit ante eget vehicula. Cras sit amet semper odio. Pellentesque lacinia, sapien a tristique ultrices, augue diam interdum nulla, non porttitor ligula nisl at nibh. Aenean in lobortis velit, sed hendrerit mi. Nam leo sem, laoreet quis diam eget, euismod lobortis purus. Aenean laoreet dui vel diam pulvinar viverra.\r\n\r\nFusce non nisi laoreet, egestas felis dignissim, tempor arcu. Ut feugiat nibh vel sodales suscipit. Phasellus ultricies eget eros id bibendum. Nunc lobortis orci interdum felis bibendum pretium. Vivamus placerat ligula a consequat ultricies. Etiam aliquam nibh vitae efficitur finibus. Duis iaculis tristique sapien. Aenean vel sollicitudin dolor. Aliquam vel nisl id augue pellentesque aliquet.\r\n\r\nFusce a egestas urna. Fusce eu sapien viverra, feugiat risus nec, accumsan enim. Donec vel sapien blandit, semper est non, congue ante. Sed lectus nulla, efficitur nec tortor nec, sollicitudin varius massa. Donec lectus mauris, vehicula ut semper eget, pharetra maximus lacus. Pellentesque pharetra facilisis luctus. Nunc lacus sapien, gravida vitae egestas in, mattis in tellus.",
    type: ["All Inclusive"],
    adultCount: 2,
    childCount: 3,
    facilities: ["Airport Shuttle", "Family Rooms", "Non-Smoking Rooms", "Spa"],
    pricePerNight: 119,
    starRating: 2,
    imageUrls: [
        "http://res.cloudinary.com/dr55yjjx4/image/upload/v1701185322/a4ypeock0piore5mbnyy.jpg",
        "http://res.cloudinary.com/dr55yjjx4/image/upload/v1701185322/vd9oude4cwkti7s9yp0y.jpg",
        "http://res.cloudinary.com/dr55yjjx4/image/upload/v1701185322/twxkbjmcoy4gzmtwc4li.jpg"
    ],
    lastUpdated: new Date(1701185323228)
};

async function seedDB() {
    try {
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB.');

        // Clear existing data
        const collections = await mongoose.connection.db.listCollections().toArray();
        for (const col of collections) {
            await mongoose.connection.db.dropCollection(col.name);
            console.log(`Dropped collection: ${col.name}`);
        }

        // Insert Users
        console.log('Seeding Users...');
        const db = mongoose.connection.db;

        const hashedUsers = await Promise.all(seedUsers.map(async u => {
            const hashedPassword = await bcrypt.hash(u.password, 8);
            return {
                ...u,
                password: hashedPassword,
                createdAt: new Date(),
                updatedAt: new Date(),
                _id: u._id ? new mongoose.Types.ObjectId(u._id) : new mongoose.Types.ObjectId()
            };
        }));

        await db.collection('users').insertMany(hashedUsers);
        console.log('Users inserted.');

        // Insert Hotel
        console.log('Seeding Hotel...');
        const hotelData = {
            ...seedHotel,
            _id: new mongoose.Types.ObjectId(seedHotel._id),
            userId: new mongoose.Types.ObjectId(seedHotel.userId),
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await db.collection('hotels').insertOne(hotelData);
        console.log('Hotel inserted.');

        console.log('Database seeded successfully!');

    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        await mongoose.disconnect();
    }
}

seedDB();
