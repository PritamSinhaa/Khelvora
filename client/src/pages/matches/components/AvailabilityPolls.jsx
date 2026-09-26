import { useState } from "react";
import { api } from "../../../lib/api";
import { id, rows, dateTime } from "../../../utils/data";
import { useResource } from "../../../hooks/useResource";
import { Action, Field, Form } from "../../../components/ui/Form";
import { Badge, Empty } from "../../../components/ui/Feedback";

export default function AvailabilityPolls({ match, canManage }) {
  const polls = useResource(`/matches/${id(match)}/availability-polls`, { interval: 30000 });
  const [showCreate, setShowCreate] = useState(false);
  const [finalOptions, setFinalOptions] = useState({});
  const openPoll = rows(polls.data).find((poll) => poll.status === "open");
  const canCreate = canManage && match.status === "scheduled" && new Date(match.startsAt) > new Date() && !openPoll;

  return <section className="panel stack">
    <div className="between gap-3">
      <div><h2 className="section-title">Availability poll</h2><p className="text-sm text-muted">Compare possible match times before confirming one.</p></div>
      {canCreate && <button className="btn" onClick={() => setShowCreate(!showCreate)}>{showCreate ? "Close form" : "Create poll"}</button>}
    </div>
    {showCreate && <Form submit="Start poll" action={(values) => api.post("/availability-polls", {
      matchId: id(match), closesAt: new Date(values.closesAt).toISOString(),
      options: [1, 2].map((number) => ({ startsAt: new Date(values[`start${number}`]).toISOString(), endsAt: new Date(values[`end${number}`]).toISOString() })),
    })} onDone={() => setShowCreate(false)}>
      <Field label="Poll closes at" name="closesAt" type="datetime-local" required />
      {[1, 2].map((number) => <div className="grid gap-4 sm:grid-cols-2" key={number}>
        <Field label={`Option ${number} starts`} name={`start${number}`} type="datetime-local" required />
        <Field label={`Option ${number} ends`} name={`end${number}`} type="datetime-local" required />
      </div>)}
    </Form>}
    {rows(polls.data).map((poll) => {
      const best = Math.max(...poll.options.map((option) => option.totals?.available || 0));
      return <article className="stack border-t border-border pt-4" key={id(poll)}>
        <div className="between"><h3 className="font-bold">{poll.status === "open" ? "Voting open" : "Final time selected"}</h3><Badge>{poll.status}</Badge></div>
        {poll.options.map((option, index) => <div className="panel stack" key={index}>
          <div className="between gap-2"><p className="font-semibold">{dateTime(option.startsAt)} – {dateTime(option.endsAt)}</p>{option.totals?.available === best && best > 0 && <Badge>Most available</Badge>}</div>
          <p className="text-xs text-muted">Available {option.totals?.available || 0} · Maybe {option.totals?.maybe || 0} · Unavailable {option.totals?.unavailable || 0}</p>
          {poll.status === "open" && <div className="row">
            {[["available", "Available"], ["maybe", "Maybe"], ["unavailable", "Unavailable"]].map(([response, label]) => <Action key={response} disabled={option.myResponse === response} action={() => api.put(`/availability-polls/${id(poll)}/votes`, { option: index, response })}>{option.myResponse === response ? "✓ " : ""}{label}</Action>)}
          </div>}
          {poll.status === "closed" && poll.selectedOption === index && <Badge>Selected time</Badge>}
        </div>)}
        {canManage && poll.status === "open" && <div className="row items-end">
          <Field label="Final time"><select value={finalOptions[id(poll)] ?? ""} onChange={(event) => setFinalOptions({ ...finalOptions, [id(poll)]: event.target.value })}><option value="" disabled>Choose an option</option>{poll.options.map((option, index) => <option key={index} value={index}>{dateTime(option.startsAt)}</option>)}</select></Field>
          <Action disabled={finalOptions[id(poll)] == null} confirm="Confirm this as the match time and close voting?" action={() => api.post(`/availability-polls/${id(poll)}/close`, { selectedOption: Number(finalOptions[id(poll)]) })}>Confirm final time</Action>
        </div>}
        {poll.status === "open" && <p className="text-xs text-muted">Closes {dateTime(poll.closesAt)} · Votes can be changed until closing.</p>}
      </article>;
    })}
    {!polls.loading && !rows(polls.data).length && <Empty title="No availability poll">A team leader can propose a few times for everyone to compare.</Empty>}
  </section>;
}
