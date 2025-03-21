import React, { useContext } from "react";
import lightPageNotFoundImage from "../imgs/404-light.png";
import darkPageNotFoundImage from "../imgs/404-dark.png";
import { Link } from "react-router-dom";
import { ThemeContext } from "../App";

const PageNotFound = () => {
  const { theme } = useContext(ThemeContext);
  return (
    <section className="h-cover relative p-10 flex flex-col items-center gap-20 text-center">
      <img
        src={theme == "light" ? darkPageNotFoundImage : lightPageNotFoundImage}
        alt=""
        className="select-none border-2 border-grey w-72 aspect-square object-cover rounded"
      />
      <h1 className="text-4xl font-gelasio leading-7">Page not found</h1>
      <p className="text-dark-grey text-xl leading-7">
        The page you are looking for does not exist. Head back to the{" "}
        <Link to="/" className="text-black underline">
          home
        </Link>{" "}
        page and explore blogs :)
      </p>
    </section>
  );
};

export default PageNotFound;
