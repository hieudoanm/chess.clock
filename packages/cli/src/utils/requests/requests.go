package requests

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

const CONTENT_TYPE_HEADER = "Content-Type"
const CONTENT_TYPE_APPLICATION_JSON = "application/json"
const RESPONSE_ERROR = "Response Error"

// Options
type Options struct {
	Header http.Header
	Query  map[string]string
	Body   map[string]interface{}
}

// Default timeout for all requests
var defaultTimeout = 10 * time.Second

// Get ...
func Get(url string, options Options) ([]byte, error) {
	request, err := http.NewRequest("GET", url, nil)
	if err != nil {
		fmt.Println("Error:", err)
		return nil, err
	}
	request.Header = options.Header

	client := &http.Client{
		Timeout: defaultTimeout,
	}
	response, err := client.Do(request)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()

	body, err := io.ReadAll(response.Body)
	if err != nil {
		fmt.Println(RESPONSE_ERROR, ":", err)
		return nil, err
	}
	return body, nil
}

// Post ...
func Post(url string, options Options) ([]byte, error) {
	data, err := json.Marshal(options.Body)
	if err != nil {
		return nil, err
	}

	request, err := http.NewRequest("POST", url, bytes.NewBuffer(data))
	if err != nil {
		return nil, err
	}
	request.Header.Set(CONTENT_TYPE_HEADER, CONTENT_TYPE_APPLICATION_JSON)

	client := &http.Client{Timeout: defaultTimeout}
	response, err := client.Do(request)
	if err != nil {
		fmt.Println(RESPONSE_ERROR, ":", err)
		return nil, err
	}
	defer response.Body.Close()

	body, err := io.ReadAll(response.Body)
	if err != nil {
		fmt.Println(RESPONSE_ERROR, ":", err)
		return nil, err
	}
	return body, nil
}

// Put ...
func Put(url string, options Options) ([]byte, error) {
	data, err := json.Marshal(options.Body)
	if err != nil {
		return nil, err
	}

	request, err := http.NewRequest("PUT", url, bytes.NewBuffer(data))
	if err != nil {
		return nil, err
	}
	request.Header = options.Header
	request.Header.Set(CONTENT_TYPE_HEADER, CONTENT_TYPE_APPLICATION_JSON)

	client := &http.Client{Timeout: defaultTimeout}
	response, err := client.Do(request)
	if err != nil {
		fmt.Println(RESPONSE_ERROR, ":", err)
		return nil, err
	}
	defer response.Body.Close()

	body, err := io.ReadAll(response.Body)
	if err != nil {
		fmt.Println(RESPONSE_ERROR, ":", err)
		return nil, err
	}
	return body, nil
}

// Delete ...
func Delete(url string, options Options) ([]byte, error) {
	data, err := json.Marshal(options.Body)
	if err != nil {
		return nil, err
	}

	request, err := http.NewRequest("DELETE", url, bytes.NewBuffer(data))
	if err != nil {
		return nil, err
	}
	request.Header = options.Header
	request.Header.Set(CONTENT_TYPE_HEADER, CONTENT_TYPE_APPLICATION_JSON)

	client := &http.Client{Timeout: defaultTimeout}
	response, err := client.Do(request)
	if err != nil {
		fmt.Println("Request error:", err)
		return nil, err
	}
	defer response.Body.Close()

	body, err := io.ReadAll(response.Body)
	if err != nil {
		fmt.Println(RESPONSE_ERROR, ":", err)
		return nil, err
	}
	return body, nil
}
