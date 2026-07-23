# Spring Boot Backend Architecture Guide (Login Flow)

This guide explains how the Spring Boot layers interact, using the **Login Flow** we just built as a practical reference. 

When the Frontend sends a login request, the data travels through different layers in the backend. Each layer has one specific job.

Here is the flow:
$$\text{Frontend Request} \rightarrow \text{Controller} \rightarrow \text{DTO} \rightarrow \text{Service} \rightarrow \text{Repository} \rightarrow \text{Entity} \rightarrow \text{Database}$$

---

## 🏢 Summary of the 6 Main Layers

| Layer | Analogy | File in our Project | What it does |
| :--- | :--- | :--- | :--- |
| **1. Entity** | The actual database table structure. | `User.java` | Defines the columns and data types in the database. |
| **2. Repository** | The clerk who directly accesses the database. | `UserRepository.java` | Executes SQL queries under the hood (Insert, Select, Delete). |
| **3. DTO** | The custom paper form filled by the user. | `LoginRequest.java`, `LoginResponse.java` | Passes only the required data between frontend and backend. |
| **4. Mapper** | The translator. | `UserMapper.java` | Converts data between Entities and DTOs. |
| **5. Service** | The supervisor (The Brain). | `UserServiceImpl.java` | Checks business logic, password matches, and validates rules. |
| **6. Controller** | The front desk counter clerk. | `AuthController.java` | Exposes the API URL endpoints and receives the request from the frontend. |

---

## 🔍 Detailed Explanation of Each Layer

### 1. The Database & Entity (`User.java`)
The **Entity** is the direct blueprint of your database table.
*   **Why we need it**: Java code cannot read database columns directly. The Entity class maps Java variables (like `String email`) to database columns (`varchar email`).
*   **Our code**:
    *   `@Entity`: Tells Spring Boot to create a table from this class.
    *   `@Table(name = "users")`: Sets the table name in PostgreSQL.
    *   `@Id` and `@GeneratedValue`: Defines the primary key (`id`) and tells the database to auto-increment it.

---

### 2. DTO - Data Transfer Object (`LoginRequest.java` & `LoginResponse.java`)
The **DTO** is a container used to pass data between the frontend and the controller.
*   **Why we need it**: Security and efficiency. We don't want to send the entire `User` object (which contains the hashed password) back to the frontend. We only send the name, email, and a message.
*   **Our code**:
    *   `LoginRequest`: Only holds `email` and `password` sent by the frontend.
    *   `LoginResponse`: Only holds `email`, `name`, and `message` sent back to the frontend.

---

### 3. Repository (`UserRepository.java`)
The **Repository** is the database helper interface.
*   **Why we need it**: Writing manual SQL queries (`SELECT * FROM...`) for every operation takes too much time. By extending `JpaRepository`, Spring Boot automatically writes all the basic SQL queries for you.
*   **Our code**:
    *   `extends JpaRepository<User, Long>`: Gives us basic queries like `save()`, `delete()`, `findById()`.
    *   `Optional<User> findByEmail(String email)`: We declared this custom method. Spring Boot automatically translates it into: `SELECT * FROM users WHERE email = ?` behind the scenes.

---

### 4. Mapper (`UserMapper.java`)
The **Mapper** is a translator class.
*   **Why we need it**: After finding a `User` entity from the database, we should not send it directly to the user. We must translate the `User` (Entity) into a `LoginResponse` (DTO) first.
*   **Our code**:
    *   It takes a `User` entity, extracts the name and email, appends a success message, and returns a new `LoginResponse` DTO.

---

### 5. Service Layer (`UserService.java` & `UserServiceImpl.java`)
The **Service** is where the actual business rules and logic are checked.
*   **Why we need it**: The controller should only receive inputs. The database should only store data. The service layer is "the brain" that does the actual verification work (e.g. checking if the user exists and matching passwords).
*   **Our code**:
    *   It asks `UserRepository` to find the user by email.
    *   If missing, it throws a "User not found" error.
    *   It uses `BCrypt` (`passwordEncoder.matches`) to check if the typed password matches the hashed database password.
    *   If correct, it maps the user to a success response.

---

### 6. Controller (`AuthController.java`)
The **Controller** is the entry gate for the frontend.
*   **Why we need it**: It intercepts requests coming from the web browser, processes the payload, and returns HTTP statuses (like `200 OK` or `401 Unauthorized`).
*   **Our code**:
    *   `@RestController`: Tells Spring this is a web controller.
    *   `@RequestMapping("/api/auth")`: Sets the base URL path.
    *   `@CrossOrigin`: Tells Spring Boot to allow request access from Vite's frontend URL (`http://localhost:5173`).
    *   `@PostMapping("/login")`: Listens for POST requests. It accepts the `LoginRequest` body, calls `userService.login()`, and returns the results.

---

## 🛠️ Visual Step-by-Step Login Journey

1.  **Frontend**: User types `name@company.com` and `password` and clicks login.
2.  **Controller**: The request hits `AuthController.java` at `/api/auth/login`. It parses the JSON input into a `LoginRequest` DTO.
3.  **Service**: The controller passes `LoginRequest` to `UserServiceImpl.java`.
4.  **Repository**: The service calls `UserRepository.java` to fetch the user record: `findByEmail("name@company.com")`.
5.  **Database**: The database returns the matching **Entity** `User` row (with ID, Name, Email, and Hashed Password) to the Repository, which passes it back to the Service.
6.  **Service Validation**: The service uses `BCrypt` to compare the typed password with the hashed password. 
7.  **Mapper**: On password match, the service uses `UserMapper.java` to convert the `User` Entity into a `LoginResponse` DTO.
8.  **Controller Response**: The service returns the DTO to the controller, which wraps it inside a `ResponseEntity` and returns it as a `200 OK` JSON response to the Frontend.
9.  **Frontend**: Browser receives the success JSON, shows a welcome message, and redirects the user to the search page.
