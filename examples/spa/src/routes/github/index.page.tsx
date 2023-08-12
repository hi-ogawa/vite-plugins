import { Link, useNavigate } from "react-router-dom";

export function Component() {
  const navigate = useNavigate();

  return (
    <div>
      Choose or input organization name
      <ul>
        {["vitejs", "remix-run", "unjs"].map((v) => (
          <li key={v}>
            <Link to={`/github/${v}`}>{v}</Link>
          </li>
        ))}
        <li>
          <input
            placeholder="Input organization..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const v = e.currentTarget.value;
                if (v) {
                  navigate(`/github/${v}`);
                }
              }
            }}
          />
        </li>
      </ul>
    </div>
  );
}
