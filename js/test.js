// Test Employee class creator
var Employee = {
    firstName,
    lastName,
    email,
    phone,
    rating1,
    rating2,
    rating3,
    checkRating1(){
        return this.rating1;
    },
    avgRating(){
        return (this.rating1 + this.rating2 + this.rating3) / 3
    }
};

var emp = new Employee();

emp.firstName = 'Alex';
emp.lastName = 'Towne';
emp.email = 'sat5825@psu.edu';
emp.phone = '7047736422';
emp.rating1 = 10;
emp.rating2 = 7;
emp.rating3 = 8.25;