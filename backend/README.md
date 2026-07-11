as you know i already have the frontend, and now want to connect with the backend, for the backend i want to use spring boot and i use start.spring.io (maven, 17.0, dependencies: spring web, dev tools, data jpa, postgre driver, Lombok)

other things for backend not setup, cuz i donot where to start. and for the searching i want to use text-based search and semantic search (pg vector) for the document content to search, but using the hybrid ranking (give a evaluation ranking for text search and semantic search). 

when upload the document, backend will use apache tika to extract the text, text clean ?(not sure), then convert to chunks using longchain4j, then remove the short one, remove duplication, then convert into numerical vector using embedding model. then this will store in database.

For the database, got user, file, record and chunk. What i think of: user will have email, name, and password. file got id, name (want unique but if the status is inactive, the user can use that name, do not how to handle this), type, size (the value of the size), path, status(active/inactive). For the status, inactive means when user delete the files, i dont want to delete all the file information, cuz in the history, user can view who delete the files (or maybe you have more correct way to handle this). for the chunk, got id, chunk text and embedding vector ?( not sure the structure correct or not, and with fk file id). then the record, got if, fk file id, fk user email, date action.

For the backend, i know there is a standard structure for spring boot: controller >service > mapper > DTO/Repository > Entity >Database, i want to strictly follow this to learn the spring boot.

Extra information:
for the chunking, i think can try semantic chunking?
then for the search: to_tsvector for keyword search, pg_trgm for fuzzy search, and pgvector for semantic search. (not sure is the best or not)
my goal is not only search by the document name for the keyword, the the keyword also can be the content inside the document, meaning that if user do not know the doc name, he can search using content