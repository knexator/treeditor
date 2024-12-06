int numberFromString (char* start, char* end) {
    int result = 0;
    while (start < end) {
        result = (*start - 48) + result * 10;
        start++;
    }
    return result;
}
